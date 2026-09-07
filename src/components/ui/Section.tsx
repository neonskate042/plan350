import type { ReactNode } from "react";
import Container from "./Container";

type Tone = "white" | "muted" | "dark";

const toneClasses: Record<Tone, string> = {
  white: "bg-white",
  muted: "bg-slate-50",
  dark: "bg-slate-900 text-white",
};

export default function Section({
  id,
  tone = "white",
  className = "",
  children,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`py-16 sm:py-20 ${toneClasses[tone]} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}
