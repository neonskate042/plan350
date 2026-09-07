import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token");
  const payload = verifyToken(token);
  if (!payload || payload.orderId !== id) {
    return NextResponse.json({ error: "Ссылка недействительна" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.email !== payload.email || !order.pdfBytes) {
    return NextResponse.json({ error: "Документ ещё не готов" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(order.pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="biznes-plan.pdf"`,
      "Content-Length": String(order.pdfBytes.length),
    },
  });
}
