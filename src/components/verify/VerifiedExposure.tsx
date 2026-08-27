"use client";
import Link from "next/link";
import type { VerifiedExposure as Exposure } from "@/lib/types";
import { cx } from "@/components/ui";
import { useBrokerage } from "./storage";

const TILE: Record<string, string> = { NVDA: "bg-green-tint text-green", AAPL: "bg-line-2 text-ink-2", VOO: "bg-orange-tint text-orange-2", KO: "bg-orange-tint text-orange-2" };
const AVATARS = [{ i: "K", c: "bg-green-2" }, { i: "M", c: "bg-coral" }, { i: "D", c: "bg-[#B08968]" }];

/** Artboard 06 — "What we collectively own": aggregated, consented, percentages only, completeness always shown. */
export function VerifiedExposureView({ e, connected }: { e: Exposure; connected?: boolean }) {
  const { brokerage, ready } = useBrokerage(connected);
  return (
    <>
      <div className="mt-[11px] bg-green-tint border border-green-line rounded-[14px] px-[14px] py-[11px] flex items-center gap-[10px]">
        <span className="flex" aria-hidden>
          {AVATARS.slice(0, e.connectedAdults).map((a, i) => (
            <span key={a.i} className={cx("w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-black border-2 border-[#FFFDF7]", a.c, i > 0 && "-ml-[7px]")}>{a.i}</span>
          ))}
        </span>
        <span className="flex-1 text-[11.5px] font-bold text-green"><b>{e.connectedAdults} of {e.totalAdults} adult members</b> connected · percentages only</span>
      </div>

      {ready && !brokerage && (
        <Link href="/profile/brokerage" className="mt-2 flex items-center justify-between bg-card border border-dashed border-line-3 rounded-[12px] px-3 py-2 text-[11px] font-extrabold text-ink-3">
          <span>Your holdings aren&apos;t included — connect to add yours (percentages only)</span>
          <span className="text-green">›</span>
        </Link>
      )}

      <div className="mt-[10px] text-[12.5px] font-black text-ink">What we collectively own</div>
      <div className="mt-[7px] bg-card border border-line rounded-[16px] px-[15px] py-[2px]">
        {e.rows.map((r, i) => (
          <div key={r.symbol} className={cx("flex items-center gap-[10px] py-[10px]", i < e.rows.length - 1 && "border-b border-paper-2")}>
            <span className={cx("w-8 h-8 rounded-[10px] flex items-center justify-center text-[9.5px] font-black shrink-0", TILE[r.symbol] ?? "bg-line-2 text-ink-2")}>{r.symbol}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-extrabold text-ink">{r.name}</div>
              <div className="text-[10px] font-bold text-ink-3">{r.ownersOf}</div>
            </div>
            <div className="text-right">
              <div className="text-[12.5px] font-black text-ink">{r.actualPct}%</div>
              <div className={cx("text-[10px] font-extrabold", r.warn ? "text-red" : "text-ink-3")}>model {r.modelPct == null ? "—" : `${r.modelPct}%`}{r.warn ? " ⚠" : ""}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-[7px] text-[10.5px] font-extrabold text-ink-3 text-center">Based on holdings shared by {e.connectedAdults} members — not the whole family&apos;s investments</p>

      <div className="mt-[10px] bg-orange-tint border border-orange-line rounded-[14px] px-[14px] py-3">
        <div className="text-[10.5px] font-black text-orange-2">MODEL vs. REALITY</div>
        <p className="mt-[5px] text-[12.5px] font-bold text-[#4A4436] leading-[1.5]">{e.mismatch.text}</p>
        <div className="flex gap-2 mt-[9px]">
          <Link href={e.mismatch.lessonHref} className="bg-green-2 text-cream-text rounded-[10px] px-[13px] py-[7px] text-[11px] font-black">📚 {e.mismatch.lessonLabel} · {e.mismatch.minutes} min</Link>
          <Link href="/club" className="bg-card border-[1.5px] border-orange-line text-orange-2 rounded-[10px] px-[13px] py-[7px] text-[11px] font-black">Discuss at Family Night</Link>
        </div>
      </div>
      <p className="mt-[10px] text-center text-[10px] font-bold text-ink-4 leading-[1.5]">Descriptive, not advice · aggregates hidden in very small groups · dollar values only where each member opted in</p>
    </>
  );
}
