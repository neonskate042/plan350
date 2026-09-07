import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Статус заказа для страницы ожидания — без самих файлов (они тяжёлые).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token");
  const payload = verifyToken(token);
  if (!payload || payload.orderId !== id) {
    return NextResponse.json({ error: "Ссылка недействительна" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: { status: true, tariff: true, email: true },
  });
  if (!order || order.email !== payload.email) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  return NextResponse.json({ status: order.status, tariff: order.tariff });
}
