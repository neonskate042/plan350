export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50">
      <div className="mx-auto w-full max-w-5xl px-6 py-10 text-sm text-slate-500">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>
            План350 — бизнес-планы для социального контракта. Мы не государственная
            организация и не гарантируем одобрение комиссией.
          </p>
          <div className="flex gap-5">
            <a href="/oferta" className="hover:text-slate-700">
              Оферта
            </a>
            <a href="/privacy" className="hover:text-slate-700">
              Обработка данных
            </a>
          </div>
        </div>
        <p className="mt-4">
          Бесплатную помощь с бизнес-планом для соцконтракта можно получить и в
          центре «Мой бизнес» вашего региона.
        </p>
      </div>
    </footer>
  );
}
