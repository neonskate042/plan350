import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Простая проверка здоровья: отвечает сайт вообще и видит ли он базу данных.
// Не отдаёт ничего чувствительного — только факт подключения и счётчик заказов.
export async function GET() {
  try {
    const orders = await prisma.order.count();
    return NextResponse.json({ ok: true, db: "connected", orders });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, db: "error", message: message.slice(0, 300) }, { status: 500 });
  }
}
