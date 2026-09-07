import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { TARIFFS } from "@/lib/products";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <Section tone="dark" className="pt-16 pb-20 sm:pt-20 sm:pb-24">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-300">
          Социальный контракт на открытие бизнеса
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
          Бизнес-план для соцконтракта — готов через 10 минут после оплаты
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Государство даёт до 350 000 ₽ на открытие своего дела. Обязательное условие —
          бизнес-план для комиссии соцзащиты. Мы собираем его под ваш регион, вид
          деятельности и вашу смету — не шаблон на всю страну.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button href="/anketa" variant="light">
            Заполнить анкету — от 1 490 ₽
          </Button>
          <a href="#kak" className="text-sm font-medium text-slate-300 underline hover:text-white">
            Как это работает →
          </a>
        </div>
        <p className="mt-6 text-sm text-slate-400">
          Сейчас доступно для: Свердловская область, Краснодарский край. Регулярно
          добавляем новые регионы.
        </p>
      </Section>

      {/* Честная рамка сразу после hero — не прячем в подвал страницы */}
      <Section tone="muted" className="py-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <b>Важно понимать:</b> ни мы, ни кто-либо ещё не может гарантировать одобрение
          комиссией — решение принимает орган социальной защиты. Мы делаем документ
          качественным и соответствующим требованиям, но окончательное решение не в
          наших руках. Бесплатную помощь с бизнес-планом можно получить и в центре
          «Мой бизнес» вашего региона — мы предлагаем то же самое, но быстрее и без
          записи на приём.
        </div>
      </Section>

      {/* Как это работает */}
      <Section id="kak">
        <h2 className="text-2xl font-bold sm:text-3xl">Как это работает</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              n: "1",
              title: "Заполняете анкету",
              text: "Регион, город, вид деятельности, сумма, ваш опыт — 5 минут.",
            },
            {
              n: "2",
              title: "Указываете смету",
              text: "Что покупаете и почём — по реальным ценам поставщиков, если уже есть, или ориентировочно.",
            },
            {
              n: "3",
              title: "Оплачиваете",
              text: "Картой или через СБП. Чек приходит на почту сразу.",
            },
            {
              n: "4",
              title: "Получаете план",
              text: "Через 10 минут на почту — готовый PDF (и смета в Excel), можно печатать и подавать.",
            },
          ].map((s) => (
            <div key={s.n}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-lg font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Что входит в документ */}
      <Section tone="muted">
        <h2 className="text-2xl font-bold sm:text-3xl">Что в документе</h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Полная структура, которую спрашивают комиссии соцзащиты — не сокращённая версия.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            "Резюме проекта",
            "Сведения о заявителе и обоснование направления",
            "Описание услуги и целевой аудитории",
            "Анализ рынка и конкурентов в вашем городе",
            "Организационный план",
            "Смета расходов — по вашим реальным цифрам",
            "Финансовая модель на 12 месяцев",
            "Точка безубыточности",
            "Оценка рисков",
            "SWOT-анализ",
            "Приложения — что ещё нужно приложить к заявлению",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-700" />
              <span className="text-sm text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Тарифы */}
      <Section id="tarify">
        <h2 className="text-2xl font-bold sm:text-3xl">Тарифы</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {Object.values(TARIFFS).map((t) => (
            <div
              key={t.id}
              className={`rounded-2xl border p-6 ${
                t.id === "standard" ? "border-blue-700 shadow-lg" : "border-slate-200"
              }`}
            >
              {t.id === "standard" && (
                <p className="mb-3 inline-block rounded-full bg-blue-700 px-3 py-1 text-xs font-semibold text-white">
                  Популярный выбор
                </p>
              )}
              <h3 className="text-lg font-bold text-slate-900">{t.title}</h3>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">
                {t.price.toLocaleString("ru-RU")} ₽
              </p>
              <ul className="mt-5 space-y-2 text-sm text-slate-600">
                <li>✓ Бизнес-план PDF под ваш регион</li>
                {t.hasExcel && <li>✓ Смета отдельным файлом Excel</li>}
                {t.hasDefensePrep && <li>✓ Памятка по защите проекта перед комиссией</li>}
                {t.hasSupport && <li>✓ Бесплатная доработка, если комиссия попросит правки</li>}
              </ul>
              <Button
                href={`/anketa?tariff=${t.id}`}
                variant={t.id === "standard" ? "primary" : "secondary"}
                className="mt-6 w-full"
              >
                Выбрать
              </Button>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" tone="muted">
        <h2 className="text-2xl font-bold sm:text-3xl">Частые вопросы</h2>
        <div className="mt-8 space-y-6">
          {[
            {
              q: "Вы гарантируете, что комиссия одобрит?",
              a: "Нет, и никто не может это гарантировать — решение принимает орган социальной защиты в вашем регионе. Мы делаем документ полным и соответствующим требованиям, это входит в нашу работу.",
            },
            {
              q: "Работает ли это в Москве?",
              a: "Нет. Соцконтракт на открытие бизнеса в Москве не действует — там другие программы поддержки. Если вы из Москвы, наш продукт вам не подойдёт, и мы говорим об этом прямо, а не после оплаты.",
            },
            {
              q: "Откуда цифры в смете?",
              a: "Из вашей анкеты. Если у вас уже есть коммерческие предложения от поставщиков — вписываете точные суммы. Если ещё нет — можно указать ориентировочные, а как только получите реальные цены, пришлите нам, и мы бесплатно пересоберём документ.",
            },
            {
              q: "Чем вы отличаетесь от бесплатной помощи в «Мой бизнес»?",
              a: "Ничем по сути — и мы советуем сначала проверить, есть ли у вас время на очередь и запись. Наше отличие — скорость (10 минут против нескольких дней) и то, что план собирается автоматически под ваши точные данные.",
            },
            {
              q: "Что если комиссия попросит доработать план?",
              a: "В тарифах «Стандарт» и «Максимум» доработка бесплатная — пришлите замечания комиссии, мы поправим документ.",
            },
          ].map((item) => (
            <div key={item.q} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h3 className="font-semibold text-slate-900">{item.q}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Финальный CTA */}
      <Section tone="dark">
        <div className="text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Готовы начать?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Анкета занимает 5 минут. Документ придёт на почту через 10 минут после оплаты.
          </p>
          <Button href="/anketa" variant="light" className="mt-6">
            Заполнить анкету
          </Button>
        </div>
      </Section>
    </>
  );
}
