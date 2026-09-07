import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createPayment, isYookassaConfigured } from "@/lib/yookassa";
import { getTariff, isTariffId, DEFAULT_TARIFF } from "@/lib/products";
import { getRegion } from "@/lib/regions";
import { SITE } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EquipmentInput = { item: string; sum: number; confirmed: boolean };

function validateEquipment(v: unknown): EquipmentInput[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > 20) return null;
  const out: EquipmentInput[] = [];
  for (const row of v) {
    if (
      !row ||
      typeof row.item !== "string" ||
      !row.item.trim() ||
      typeof row.sum !== "number" ||
      !Number.isFinite(row.sum) ||
      row.sum <= 0
    ) {
      return null;
    }
    out.push({ item: row.item.trim().slice(0, 200), sum: Math.round(row.sum), confirmed: Boolean(row.confirmed) });
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const applicantName = typeof body.applicantName === "string" ? body.applicantName.trim().slice(0, 200) : "";
    const regionKey = typeof body.regionKey === "string" ? body.regionKey : "";
    const city = typeof body.city === "string" ? body.city.trim().slice(0, 200) : "";
    const activity = typeof body.activity === "string" ? body.activity.trim().slice(0, 400) : "";
    const experience = typeof body.experience === "string" ? body.experience.trim().slice(0, 500) : "";
    const requestedSum = Number(body.requestedSum);
    const tariffId = isTariffId(body.tariff) ? body.tariff : DEFAULT_TARIFF;
    const tariff = getTariff(tariffId)!;

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Проверьте адрес почты." }, { status: 400 });
    }
    if (!applicantName) {
      return NextResponse.json({ error: "Укажите, пожалуйста, ФИО." }, { status: 400 });
    }
    const region = getRegion(regionKey);
    if (!region) {
      return NextResponse.json(
        { error: "Этот регион пока не поддерживается — напишите нам, добавим." },
        { status: 400 },
      );
    }
    if (!city) {
      return NextResponse.json({ error: "Укажите населённый пункт." }, { status: 400 });
    }
    if (!activity) {
      return NextResponse.json({ error: "Опишите, пожалуйста, вид деятельности." }, { status: 400 });
    }
    if (!Number.isFinite(requestedSum) || requestedSum < 10000 || requestedSum > 500000) {
      return NextResponse.json(
        { error: "Проверьте запрашиваемую сумму (от 10 000 до 500 000 ₽)." },
        { status: 400 },
      );
    }
    const equipment = validateEquipment(body.equipment);
    if (!equipment) {
      return NextResponse.json(
        { error: "Проверьте список сметы — у каждой позиции должны быть название и сумма." },
        { status: 400 },
      );
    }

    if (!isYookassaConfigured()) {
      return NextResponse.json(
        { error: "Приём оплаты ещё подключается. Напишите нам — оформим вручную." },
        { status: 503 },
      );
    }

    const order = await prisma.order.create({
      data: {
        email,
        applicantName,
        regionKey,
        city,
        activity,
        requestedSum: Math.round(requestedSum),
        experience,
        equipment,
        tariff: tariffId,
        price: tariff.price,
        status: "draft",
      },
    });

    const payment = await createPayment({
      amount: tariff.price,
      description: tariff.receiptTitle,
      receiptTitle: tariff.receiptTitle,
      email,
      returnUrl: `${SITE}/spasibo?order=${order.id}`,
      metadata: { orderId: order.id },
      idempotenceKey: crypto
        .createHash("sha256")
        .update(`${order.id}:${Math.floor(Date.now() / 60000)}`)
        .digest("hex"),
    });

    await prisma.order.update({ where: { id: order.id }, data: { paymentId: payment.id } });

    const url = payment.confirmation?.confirmation_url;
    if (!url) {
      return NextResponse.json(
        { error: "Не удалось открыть форму оплаты. Попробуйте ещё раз." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error("checkout error:", e);
    return NextResponse.json(
      { error: "Что-то пошло не так с оплатой. Попробуйте ещё раз или напишите нам." },
      { status: 500 },
    );
  }
}
