import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import Metrika from "@/components/Metrika";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "План350 — бизнес-план для социального контракта за 10 минут",
  description:
    "Персональный бизнес-план для получения социального контракта на открытие бизнеса — под ваш регион и вид деятельности, готов через 10 минут после оплаты.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${manrope.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <Metrika />
      </body>
    </html>
  );
}
