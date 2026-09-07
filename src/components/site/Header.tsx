import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-slate-900">
          План<span className="text-blue-700">350</span>
        </Link>
        <nav className="hidden gap-6 text-sm font-medium text-slate-600 sm:flex">
          <Link href="/#kak" className="hover:text-slate-900">
            Как это работает
          </Link>
          <Link href="/#tarify" className="hover:text-slate-900">
            Тарифы
          </Link>
          <Link href="/#faq" className="hover:text-slate-900">
            Вопросы
          </Link>
        </nav>
        <Link
          href="/anketa"
          className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Заказать план
        </Link>
      </div>
    </header>
  );
}
