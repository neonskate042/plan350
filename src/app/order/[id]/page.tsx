import Section from "@/components/ui/Section";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/access";
import { getTariff } from "@/lib/products";

export const metadata = { title: "Ваш заказ — План350" };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;
  const payload = verifyToken(token);

  if (!payload || payload.orderId !== id) {
    return (
      <Section className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Ссылка недействительна</h1>
        <p className="mt-3 text-slate-600">
          Проверьте, что перешли по полной ссылке из письма, или напишите нам.
        </p>
      </Section>
    );
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: { status: true, email: true, tariff: true },
  });

  if (!order || order.email !== payload.email) {
    return (
      <Section className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Заказ не найден</h1>
      </Section>
    );
  }

  const tariff = getTariff(order.tariff);
  const tokenQs = `token=${encodeURIComponent(token!)}`;

  return (
    <Section className="text-center">
      <div className="mx-auto max-w-xl">
        {order.status === "ready" && (
          <>
            <h1 className="text-3xl font-extrabold text-slate-900">Ваш план готов</h1>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href={`/api/order/${id}/pdf?${tokenQs}`}
                className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-base font-semibold text-white hover:bg-blue-800"
              >
                Скачать бизнес-план (PDF)
              </a>
              {tariff?.hasExcel && (
                <a
                  href={`/api/order/${id}/excel?${tokenQs}`}
                  className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-base font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Скачать смету (Excel)
                </a>
              )}
            </div>
            <p className="mt-6 text-sm text-slate-500">
              Если в смете были ориентировочные суммы — уточните их у поставщиков перед
              подачей. Если реальная цена отличается, напишите нам, пересоберём документ
              бесплатно.
            </p>
          </>
        )}

        {(order.status === "paid" || order.status === "generating") && (
          <>
            <h1 className="text-2xl font-bold text-slate-900">План ещё собирается</h1>
            <p className="mt-3 text-slate-600">
              Обычно это занимает не больше 10–15 минут. Обновите страницу чуть позже —
              или дождитесь письма на почту со ссылкой.
            </p>
          </>
        )}

        {order.status === "failed" && (
          <>
            <h1 className="text-2xl font-bold text-slate-900">Небольшая задержка</h1>
            <p className="mt-3 text-slate-600">
              При автоматической подготовке произошла ошибка. Оплата получена, план
              обязательно подготовим — мы уже в курсе и разбираемся вручную.
            </p>
          </>
        )}
      </div>
    </Section>
  );
}
