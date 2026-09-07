import Section from "@/components/ui/Section";

export const metadata = { title: "Спасибо за оплату — План350" };

export default function SpasiboPage() {
  return (
    <Section className="text-center">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-extrabold text-slate-900">Оплата прошла успешно</h1>
        <p className="mt-4 text-slate-600">
          Мы уже собираем ваш бизнес-план. Обычно это занимает около 10 минут — документ
          придёт на почту, которую вы указали в анкете, вместе со ссылкой на скачивание.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Если письмо не пришло в течение часа — проверьте папку «Спам» или напишите нам,
          мы поможем.
        </p>
      </div>
    </Section>
  );
}
