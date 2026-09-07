import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayment } from "@/lib/yookassa";
import { generateOrder } from "@/lib/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Уведомление от ЮKassa об оплате.
// Телу запроса не доверяем: берём только id платежа и перезапрашиваем его статус по API.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const event = body?.event as string | undefined;
    const paymentId = body?.object?.id as string | undefined;

    if (!paymentId) {
      return NextResponse.json({ ok: true, skipped: "no id" });
    }
    if (event !== "payment.succeeded") {
      return NextResponse.json({ ok: true, skipped: event || "unknown" });
    }

    const payment = await getPayment(paymentId);
    if (payment.status !== "succeeded" || !payment.paid) {
      return NextResponse.json({ ok: true, skipped: payment.status });
    }

    const orderId = payment.metadata?.orderId;
    if (!orderId) {
      console.error("webhook: платёж без orderId в metadata", paymentId);
      return NextResponse.json({ ok: true, skipped: "no metadata" });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      console.error("webhook: заказ не найден", orderId);
      return NextResponse.json({ ok: true, skipped: "order not found" });
    }

    // Сверяем сумму: оплатили ровно столько, сколько стоит тариф.
    const paidAmount = Number(payment.amount.value);
    if (!Number.isFinite(paidAmount) || paidAmount + 0.01 < order.price) {
      console.error("webhook: сумма не сходится", paymentId, payment.amount, order.price);
      return NextResponse.json({ ok: true, skipped: "amount mismatch" });
    }

    // Уже оплачено — повторное уведомление игнорируем (генерацию не дублируем).
    if (order.paid) {
      return NextResponse.json({ ok: true, already: true });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { paid: true, paymentId, paidAt: new Date(), status: "paid" },
    });

    // Генерация может занять до минуты — не блокируем ответ ЮKassa этим временем.
    generateOrder(orderId).catch((e) => console.error("generateOrder (webhook) failed:", e));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("yookassa webhook error:", e);
    // 500 заставит ЮKassa повторить уведомление — это то, что нам нужно при сбое.
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
