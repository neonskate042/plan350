"use client";

import { useState } from "react";
import { VERIFIED_REGIONS } from "@/lib/regions";
import { TARIFFS, type TariffId } from "@/lib/products";

type EquipmentRow = { item: string; sum: string; confirmed: boolean };

const emptyRow = (): EquipmentRow => ({ item: "", sum: "", confirmed: false });

export default function AnketaForm({ initialTariff }: { initialTariff: TariffId }) {
  const [applicantName, setApplicantName] = useState("");
  const [email, setEmail] = useState("");
  const [regionKey, setRegionKey] = useState(VERIFIED_REGIONS[0]?.key ?? "");
  const [city, setCity] = useState("");
  const [activity, setActivity] = useState("");
  const [requestedSum, setRequestedSum] = useState("350000");
  const [experience, setExperience] = useState("");
  const [tariff, setTariff] = useState<TariffId>(initialTariff);
  const [equipment, setEquipment] = useState<EquipmentRow[]>([emptyRow(), emptyRow()]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const equipmentSum = equipment.reduce((a, r) => a + (Number(r.sum) || 0), 0);
  const sumMismatch =
    Number(requestedSum) > 0 && equipmentSum > 0 && equipmentSum !== Number(requestedSum);

  function updateRow(i: number, patch: Partial<EquipmentRow>) {
    setEquipment((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setEquipment((rows) => [...rows, emptyRow()]);
  }

  function removeRow(i: number) {
    setEquipment((rows) => (rows.length > 1 ? rows.filter((_, idx) => idx !== i) : rows));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setError("");

    try {
      try {
        const id = process.env.NEXT_PUBLIC_METRIKA_ID;
        const ym = (window as unknown as { ym?: (...a: unknown[]) => void }).ym;
        if (id && typeof ym === "function") ym(Number(id), "reachGoal", "checkout_start");
      } catch {
        // аналитика не должна ломать оплату
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantName,
          email,
          regionKey,
          city,
          activity,
          requestedSum: Number(requestedSum),
          experience,
          tariff,
          equipment: equipment
            .filter((r) => r.item.trim() && Number(r.sum) > 0)
            .map((r) => ({ item: r.item.trim(), sum: Number(r.sum), confirmed: r.confirmed })),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (data.url) {
        window.location.href = data.url as string;
        return;
      }
      setStatus("error");
      setError(data.error || "Не получилось начать оплату. Попробуйте ещё раз.");
    } catch {
      setStatus("error");
      setError("Нет связи с сервером. Проверьте интернет и попробуйте снова.");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-slate-900">О вас</h2>
        <div>
          <label className={labelClass}>ФИО</label>
          <input
            required
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            className={inputClass}
            placeholder="Иванова Мария Сергеевна"
          />
        </div>
        <div>
          <label className={labelClass}>Почта — на неё придёт готовый план</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@mail.ru"
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Регион</label>
            <select
              value={regionKey}
              onChange={(e) => setRegionKey(e.target.value)}
              className={inputClass}
            >
              {VERIFIED_REGIONS.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.name}
                </option>
              ))}
              <option value="" disabled>
                Другой регион — пока не поддерживаем, напишите нам
              </option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Город / населённый пункт</label>
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
              placeholder="Нижний Тагил"
            />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-bold text-slate-900">О деле</h2>
        <div>
          <label className={labelClass}>Вид деятельности — своими словами</label>
          <textarea
            required
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className={inputClass}
            rows={3}
            placeholder="Выездной шиномонтаж, обслуживание частных автомобилей"
          />
        </div>
        <div>
          <label className={labelClass}>Ваш опыт в этой сфере (если есть)</label>
          <textarea
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className={inputClass}
            rows={2}
            placeholder="Например: 3 года работала на автомойке"
          />
        </div>
        <div className="max-w-xs">
          <label className={labelClass}>Запрашиваемая сумма, ₽</label>
          <input
            required
            type="number"
            min={10000}
            max={500000}
            step={1000}
            value={requestedSum}
            onChange={(e) => setRequestedSum(e.target.value)}
            className={inputClass}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Смета — на что потратите</h2>
          <p className="mt-1 text-sm text-slate-500">
            Если у вас уже есть коммерческое предложение от поставщика — впишите точную
            сумму и отметьте галочкой. Если ещё нет — впишите ориентировочную цену; как
            только получите реальную, пришлите нам, пересоберём документ бесплатно.
          </p>
        </div>

        <div className="space-y-3">
          {equipment.map((row, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
              <input
                value={row.item}
                onChange={(e) => updateRow(i, { item: e.target.value })}
                placeholder="Например: переносной шиномонтажный станок"
                className="min-w-[220px] flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <input
                type="number"
                min={0}
                value={row.sum}
                onChange={(e) => updateRow(i, { sum: e.target.value })}
                placeholder="Сумма, ₽"
                className="w-32 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={row.confirmed}
                  onChange={(e) => updateRow(i, { confirmed: e.target.checked })}
                />
                Есть КП
              </label>
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-sm text-slate-400 hover:text-rose-600"
                aria-label="Удалить позицию"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          + Добавить позицию
        </button>

        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Сумма позиций: <b>{equipmentSum.toLocaleString("ru-RU")} ₽</b>
          {sumMismatch && (
            <span className="ml-2 text-amber-700">
              — отличается от запрашиваемой суммы, это нормально на черновике, документ
              честно покажет расхождение.
            </span>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Тариф</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.values(TARIFFS).map((t) => (
            <label
              key={t.id}
              className={`cursor-pointer rounded-xl border p-4 ${
                tariff === t.id ? "border-blue-700 ring-2 ring-blue-100" : "border-slate-200"
              }`}
            >
              <input
                type="radio"
                name="tariff"
                className="sr-only"
                checked={tariff === t.id}
                onChange={() => setTariff(t.id)}
              />
              <p className="font-semibold text-slate-900">{t.title}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {t.price.toLocaleString("ru-RU")} ₽
              </p>
            </label>
          ))}
        </div>
      </section>

      <div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
        >
          {status === "loading"
            ? "Открываю оплату…"
            : `Оплатить ${TARIFFS[tariff].price.toLocaleString("ru-RU")} ₽`}
        </button>
        <p className="mt-3 text-xs text-slate-500">
          Оплата картой или СБП через ЮKassa. Нажимая кнопку, вы соглашаетесь с{" "}
          <a href="/oferta" className="underline hover:text-slate-700">
            офертой
          </a>{" "}
          и{" "}
          <a href="/privacy" className="underline hover:text-slate-700">
            политикой обработки данных
          </a>
          .
        </p>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>
    </form>
  );
}
