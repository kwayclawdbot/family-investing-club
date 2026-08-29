"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/components/ui";
import { CloseIcon, KaiSpark } from "@/components/ui/icons";
import type { Register } from "@/lib/learn/schema";

/** Warm, beginner-first lesson chrome in FIC's design language (matches the artboard-21 player). */

export const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function LessonHeader({ backHref, pct, right }: { backHref: string; pct: number; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-[14px]">
      <Link href={backHref} aria-label="Exit lesson" className="text-ink-3"><CloseIcon size={20} /></Link>
      <div className="flex-1 h-[10px] rounded-[6px] bg-line overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-[6px] bg-green-2 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${Math.max(pct, 6)}%` }} />
      </div>
      {right}
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, tone = "green", className }: { children: ReactNode; onClick?: () => void; disabled?: boolean; tone?: "green" | "orange" | "red"; className?: string }) {
  const t = tone === "green" ? "bg-green-2 shadow-[0_3px_0_#3A6B3E]" : tone === "orange" ? "bg-orange shadow-[0_3px_0_#C96D25]" : "bg-red shadow-[0_3px_0_#A8503F]";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cx("w-full rounded-[16px] py-[15px] text-center text-[15.5px] font-black text-cream-text disabled:opacity-50 disabled:shadow-none active:translate-y-[2px] active:shadow-none transition motion-reduce:transition-none", t, className)}>
      {children}
    </button>
  );
}

export function KaiRow({ lessonId, text }: { lessonId: string; text?: ReactNode }) {
  return (
    <Link href={`/kai?context=lesson:${lessonId}`} className="flex items-center gap-[10px] rounded-[14px] border border-line bg-card px-[14px] py-[11px]">
      <span className="w-[26px] h-[26px] rounded-[9px] bg-purple text-white flex items-center justify-center shrink-0"><KaiSpark size={13} /></span>
      <span className="text-[12.5px] font-bold text-ink-2">{text ?? <>Stuck? Ask <b className="text-purple-2">Kai</b> for a hint — it won&apos;t cost XP.</>}</span>
    </Link>
  );
}

/** The guide (Kai) speaking — register changes only the voice, never the facts. */
export function GuideLine({ children, register }: { children: ReactNode; register: Register }) {
  return (
    <div className="flex items-start gap-[10px] rounded-[14px] bg-purple-tint border border-purple-line px-[14px] py-[11px]">
      <span className="w-[26px] h-[26px] rounded-[9px] bg-purple text-white flex items-center justify-center shrink-0 mt-[1px]"><KaiSpark size={13} /></span>
      <p className="text-[13.5px] font-bold text-ink leading-[1.5]"><span className="text-purple-2 font-black">{register === "kid" ? "Kai says: " : "Kai · "}</span>{children}</p>
    </div>
  );
}

export function FeedbackNote({ kind, title, children, action }: { kind: "correct" | "wrong" | "info"; title?: string; children?: ReactNode; action?: ReactNode }) {
  const cls = kind === "correct" ? "bg-green-tint border-green-2" : kind === "wrong" ? "bg-[#FBE9E4] border-red" : "bg-card border-line";
  const tc = kind === "correct" ? "text-green" : kind === "wrong" ? "text-red" : "text-ink";
  return (
    <div className={cx("rounded-[18px] border-2 p-4", cls)}>
      {title && <div className={cx("text-[16px] font-black", tc)}>{title}</div>}
      {children && <div className="mt-1 text-[13px] font-semibold text-[#4A4436] leading-[1.5]">{children}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export type OptionState = "idle" | "selected" | "correct" | "wrong" | "dim";
export function OptionButton({ label, index, state, disabled, onClick, letter = true }: { label: string; index: number; state: OptionState; disabled?: boolean; onClick: () => void; letter?: boolean }) {
  let cls = "bg-card border-[1.5px] border-line shadow-[0_2px_0_#EFE4CF]";
  let badge = "bg-line-2 text-ink-3";
  if (state === "selected") { cls = "bg-green-tint border-2 border-green-2 shadow-[0_2px_0_#C9DCBD]"; badge = "bg-green-2 text-white"; }
  if (state === "correct") { cls = "bg-green-tint border-2 border-green-2 shadow-[0_2px_0_#C9DCBD]"; badge = "bg-green-2 text-white"; }
  if (state === "wrong") { cls = "bg-[#FBE9E4] border-2 border-red shadow-[0_2px_0_#E8C9C1]"; badge = "bg-red text-white"; }
  if (state === "dim") cls += " opacity-60";
  return (
    <button type="button" role="radio" aria-checked={state === "selected"} disabled={disabled} onClick={onClick} className={cx("text-left rounded-[16px] px-4 py-[14px] flex items-center gap-3 transition active:scale-[0.99] motion-reduce:transition-none", cls)}>
      {letter && <span className={cx("w-[26px] h-[26px] rounded-[8px] flex items-center justify-center text-[13px] font-black shrink-0", badge)}>{LETTERS[index] ?? index + 1}</span>}
      <span className="text-[15px] font-extrabold text-ink leading-[1.35]">{label}</span>
    </button>
  );
}

export function Eyebrow({ children, tone = "orange" }: { children: ReactNode; tone?: "orange" | "purple" | "green" }) {
  const c = tone === "orange" ? "text-orange" : tone === "purple" ? "text-purple-2" : "text-green";
  return <div className={cx("text-[11.5px] font-extrabold tracking-[0.3px] uppercase", c)}>{children}</div>;
}

/** Deterministic shuffle so a re-ask is a genuine variant but stable across renders. */
export function shuffled<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
