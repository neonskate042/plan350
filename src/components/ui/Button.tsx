import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "light" | "secondary";

const base =
  "inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

const variants: Record<Variant, string> = {
  primary:
    "bg-blue-700 text-white shadow-lg shadow-blue-700/20 hover:bg-blue-800 focus-visible:ring-blue-700",
  light: "bg-white text-blue-700 shadow-lg hover:bg-blue-50 focus-visible:ring-white",
  secondary: "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:ring-slate-400",
};

export default function Button({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
