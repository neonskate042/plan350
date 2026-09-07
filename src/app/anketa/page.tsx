import Section from "@/components/ui/Section";
import AnketaForm from "@/components/AnketaForm";
import { isTariffId, DEFAULT_TARIFF } from "@/lib/products";

export const metadata = { title: "Анкета — План350" };

export default async function AnketaPage({
  searchParams,
}: {
  searchParams: Promise<{ tariff?: string }>;
}) {
  const { tariff } = await searchParams;
  const initialTariff = isTariffId(tariff) ? tariff : DEFAULT_TARIFF;

  return (
    <Section>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-extrabold text-slate-900">Анкета на бизнес-план</h1>
        <p className="mt-3 text-slate-600">
          5 минут на заполнение. После оплаты план придёт на почту примерно через 10 минут.
        </p>
        <div className="mt-10">
          <AnketaForm initialTariff={initialTariff} />
        </div>
      </div>
    </Section>
  );
}
