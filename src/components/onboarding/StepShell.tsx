"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "@/components/ui/icons";
import { STEPS, prevStep, type Step } from "./steps";

/** Header (back · 5 dots · Skip) + bottom-pinned CTA, per artboards 02–06. */
export function StepShell({
  step,
  children,
  cta,
}: {
  step: Step;
  children: ReactNode;
  cta: ReactNode;
}) {
  const idx = STEPS.indexOf(step);
  return (
    <div className="flex-1 flex flex-col px-[22px] pt-[calc(18px+env(safe-area-inset-top))] sm:pt-[70px]">
      <div className="flex items-center gap-[14px]">
        <Link href={prevStep(step)} aria-label="Back" className="text-ink-3 -ml-1">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1 flex gap-[6px] justify-center" aria-label={`Step ${idx + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`h-2 rounded-[4px] transition-all ${i === idx ? "w-[22px] bg-green-2" : i < idx ? "w-2 bg-green-2" : "w-2 bg-line-3"}`}
            />
          ))}
        </div>
        <Link href="/home" className="text-[13px] font-extrabold text-ink-4">
          Skip
        </Link>
      </div>
      {children}
      <div className="mt-auto pt-6 pb-[calc(24px+env(safe-area-inset-bottom))] sm:pb-[44px]">{cta}</div>
    </div>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <h1 className="mt-6 text-[24px] font-black text-ink leading-[1.25]">{children}</h1>;
}
export function Subtitle({ children }: { children: ReactNode }) {
  return <p className="mt-[7px] text-[13.5px] font-semibold text-ink-3 leading-[1.5]">{children}</p>;
}

/** Raised CTA with the artboard's 3px "shadow" underline. */
export function Cta({
  children,
  tone = "green",
  onClick,
  href,
}: {
  children: ReactNode;
  tone?: "green" | "orange";
  onClick?: () => void;
  href?: string;
}) {
  const cls = `block w-full rounded-[16px] p-4 text-center text-[16px] font-black text-cream-text active:translate-y-[2px] active:shadow-none transition ${
    tone === "green" ? "bg-green-2 shadow-[0_3px_0_#3A6B3E]" : "bg-orange shadow-[0_3px_0_#C96D25]"
  }`;
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/** Selectable option card with ✓ badge when selected. */
export function OptionCard({
  title,
  sub,
  selected,
  onSelect,
  leading,
  padding = "py-[14px] px-4",
}: {
  title: string;
  sub: string;
  selected: boolean;
  onSelect: () => void;
  leading?: ReactNode;
  padding?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`w-full text-left bg-card rounded-[14px] flex items-center gap-3 ${padding} ${
        selected ? "border-2 border-green-2" : "border-[1.5px] border-line"
      }`}
    >
      {leading}
      {selected && !leading && <Check />}
      <div className="flex-1">
        <div className="text-[14.5px] font-extrabold text-ink">{title}</div>
        <div className="text-[12px] font-semibold text-ink-3">{sub}</div>
      </div>
      {selected && leading && <Check />}
    </button>
  );
}
export function Check() {
  return (
    <span className="w-[22px] h-[22px] rounded-full bg-green-2 text-white text-[12px] font-black flex items-center justify-center shrink-0">
      ✓
    </span>
  );
}
