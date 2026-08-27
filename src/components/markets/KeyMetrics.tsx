"use client";
import Link from "next/link";
import { useState } from "react";
import type { Metric } from "@/lib/types";
import { Sheet } from "@/components/ui/extras";

/** Tap-to-learn metric grid: each cell opens a plain-language definition. */
export function KeyMetrics({ metrics }: { metrics: Metric[] }) {
  const [open, setOpen] = useState<Metric | null>(null);
  return (
    <>
      <div className="grid grid-cols-2 gap-[8px] mt-2">
        {metrics.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setOpen(m)}
            className="rounded-[14px] border border-line bg-card px-3 py-[10px] text-left active:bg-paper-2"
          >
            <div className="flex items-center gap-1 text-[10.5px] font-extrabold text-ink-3 uppercase tracking-[0.3px]">
              {m.label}
              <span className="w-[13px] h-[13px] rounded-full border-[1.5px] border-ink-4 text-ink-4 text-[8px] flex items-center justify-center leading-none">?</span>
            </div>
            <div className="mt-[2px] text-[16px] font-black text-ink">{m.value}</div>
          </button>
        ))}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.label}>
        {open && (
          <>
            <div className="text-[24px] font-black text-ink">{open.value}</div>
            <p className="mt-2 text-[14px] font-bold text-ink-2 leading-[1.55]">{open.definition}</p>
            <Link href={open.lessonHref} className="inline-flex mt-4 h-[40px] px-4 items-center rounded-[12px] bg-green text-cream-text text-[13px] font-black">
              Learn this concept →
            </Link>
          </>
        )}
      </Sheet>
    </>
  );
}
