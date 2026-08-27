"use client";
import Link from "next/link";
import { useState } from "react";
import type { Metric } from "@/lib/types";
import { Sheet } from "@/components/ui/extras";
import type { Dossier } from "./dossier-data";

/**
 * Educational dossier (artboard 24): what the company does, how it makes money, key numbers with tap-to-learn.
 * The dossier is UNCHANGED by the club layer (artboard 08) — it just gets a smaller eyebrow when `compact`.
 */
export function DossierCard({ firstName, dossier, metrics, compact }: { firstName: string; dossier: Dossier; metrics: Metric[]; compact?: boolean }) {
  const [open, setOpen] = useState<Metric | null>(null);
  const byKey = Object.fromEntries(metrics.map((m) => [m.key, m]));

  const numbers = (
    <div className={`grid grid-cols-2 gap-2 ${compact ? "mt-[11px]" : "mt-[9px]"}`}>
      {dossier.numbers.map((n) => {
        const m = byKey[n.key];
        const learnable = n.learn && !!m;
        const inner = (
          <>
            <div className={`inline-block text-[10px] font-extrabold ${learnable ? "text-purple-2 border-b border-dotted border-purple pb-[1px]" : "text-ink-3"}`}>{n.label}</div>
            <div className="mt-[3px] text-[15px] font-black text-ink">{n.value}</div>
          </>
        );
        return learnable ? (
          <button key={n.key} type="button" onClick={() => setOpen(m)} className="rounded-[12px] border border-line bg-paper px-3 py-[10px] text-left active:bg-paper-2">{inner}</button>
        ) : (
          <div key={n.key} className="rounded-[12px] border border-line bg-paper px-3 py-[10px]">{inner}</div>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="mt-[14px] rounded-card border border-line bg-card px-4 py-[14px]">
        <div className="text-[11.5px] font-black text-orange">{compact ? "THE DOSSIER — UNCHANGED" : `WHAT DOES ${firstName.toUpperCase()} ACTUALLY DO?`}</div>
        <p className="mt-[6px] text-[13px] font-semibold text-[#4A4436] leading-[1.5]">{dossier.what}</p>
      </div>

      {dossier.mix.length > 0 && (
        <div className="mt-[10px] rounded-card border border-line bg-card px-4 py-[14px]">
          <div className="text-[11.5px] font-black text-orange">HOW IT MAKES MONEY</div>
          {dossier.mix.map((m) => (
            <div key={m.label} className="mt-[7px] flex items-center gap-[10px]">
              <span className="w-[74px] text-[11.5px] font-extrabold text-[#4A4436]">{m.label}</span>
              <div className="flex-1 h-[14px] rounded-[7px] bg-line-2 overflow-hidden"><div className={`h-full rounded-[7px] ${m.color}`} style={{ width: `${m.pct}%` }} /></div>
              <span className="w-[34px] text-right text-[11.5px] font-black text-ink">{m.pct}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-[10px] rounded-card border border-line bg-card px-4 py-[14px]">
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] font-black text-orange">KEY NUMBERS</span>
          <span className="text-[10px] font-extrabold text-purple-2">dotted = tap to learn</span>
        </div>
        {numbers}
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.label}>
        {open && (
          <>
            <div className="text-[24px] font-black text-ink">{dossier.numbers.find((n) => n.key === open.key)?.value ?? open.value}</div>
            <p className="mt-2 text-[14px] font-bold text-ink-2 leading-[1.55]">{open.definition}</p>
            <Link href={open.lessonHref} className="mt-4 inline-flex h-[40px] items-center rounded-[12px] bg-green px-4 text-[13px] font-black text-cream-text">Learn this concept →</Link>
          </>
        )}
      </Sheet>
    </>
  );
}
