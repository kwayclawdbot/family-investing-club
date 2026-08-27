"use client";
import { useState } from "react";
import type { ClubOverview, PortfolioTab } from "@/lib/types";
import { cx } from "@/components/ui";
import { performanceTiles } from "@/lib/fixtures/v12-club";
import { PerfChart } from "./PerfChart";
import { MemberDot, MiniSpark, Panel, SectionLabel, pctText } from "./shared";

const MEDAL = ["🥇", "🥈", "🥉"];
const DONUT: Record<string, string> = { "bg-green-2": "#4C8C4A", "bg-orange": "#E58234", "bg-purple": "#8B7BC7", "bg-gold": "#E9B949", "bg-line-3": "#E4DAC4" };

/** v12 — Club Performance answers one question: how are we doing? */
export function PerformancePane({ o, p }: { o: ClubOverview; p: PortfolioTab }) {
  const [range, setRange] = useState("YTD");
  const [view, setView] = useState<"MODEL" | "VERIFIED ✓">("MODEL");
  const s = o.series.find((x) => x.range === range) ?? o.series[0];
  const r = 30, C = 2 * Math.PI * r;
  const arcs = p.allocation.reduce<{ label: string; color: string; len: number; off: number }[]>((out, a) => { const off = out.reduce((n, x) => n + x.len, 0); return [...out, { label: a.label, color: a.color, len: (a.pct / 100) * C, off }]; }, []);
  return (
    <>
      <div className="mt-[13px]"><span className="text-[34px] font-black text-[#3A8C4A]">{pctText(o.ytdPct)}</span><span className="ml-2 text-[13px] font-extrabold text-ink-3">{range} · ${o.value.toLocaleString()}</span></div>
      <PerfChart club={s.club} benchmark={s.benchmark} markers={s.markers} height={92} className="mt-1" />
      <div className="flex gap-[5px] mt-1 items-center">
        {o.ranges.map((x) => <button key={x} onClick={() => setRange(x)} className={cx("px-2 py-1 text-[10.5px] rounded-[8px]", x === range ? "bg-ink text-cream-text font-black px-[11px]" : "text-ink-4 font-extrabold")}>{x}</button>)}
        <span className="ml-auto flex bg-[#EFE7D6] rounded-[9px] p-[2px]">
          {(["MODEL", "VERIFIED ✓"] as const).map((v) => <button key={v} onClick={() => setView(v)} className={cx("rounded-[7px] px-[9px] py-[3px] text-[9px] font-black", view === v ? "bg-[#FFFDF7] text-ink" : "text-ink-3")}>{v}</button>)}
        </span>
      </div>
      <div className="flex gap-2 mt-3">
        {[["VS S&P 500", pctText(performanceTiles.vsSpPct), "text-[#3A8C4A]"], ["POSITIVE PICKS", `${performanceTiles.positivePicksPct}%`, "text-ink"]].map(([l, v, c]) => (
          <div key={l} className="flex-1 bg-card border border-line rounded-[13px] px-3 py-[10px] text-center"><div className="text-[9px] font-black text-ink-3">{l}</div><div className={cx("text-[16px] font-black mt-[2px]", c)}>{v}</div></div>
        ))}
        <div className="flex-1 bg-card border border-line rounded-[13px] px-3 py-[10px] text-center"><div className="text-[9px] font-black text-ink-3">BEST PICK</div><div className="text-[16px] font-black text-ink mt-[2px]">{o.metrics.bestPick.symbol} <span className="text-[10px] text-[#3A8C4A]">{pctText(o.metrics.bestPick.pct)}</span></div></div>
      </div>
      {view === "VERIFIED ✓" && <p className="mt-2 text-[10px] font-bold text-ink-4 text-center">Verified exposure: {o.metrics.verified.connected} of {o.metrics.verified.adults} adults connected · percentages only</p>}
      <SectionLabel className="mt-[14px] mb-[6px]">TOP INVESTORS · PICKS YTD</SectionLabel>
      <Panel className="px-[14px] py-[3px]">
        {o.topInvestors.map((t, i) => (
          <div key={t.memberId} className={cx("flex items-center gap-[9px] py-[9px]", i < o.topInvestors.length - 1 && "border-b border-paper-2")}>
            <span className="text-[12px]">{MEDAL[i] ?? t.rank}</span><MemberDot memberId={t.memberId} size={28} />
            <span className="flex-1 text-[12.5px] font-extrabold text-ink">{t.name}</span><MiniSpark up={t.ytdPct >= 0} /><span className="text-[12.5px] font-black text-[#3A8C4A]">{pctText(t.ytdPct)}</span>
          </div>
        ))}
      </Panel>
      <SectionLabel className="mt-3 mb-[6px]">ALLOCATION</SectionLabel>
      <Panel className="px-[15px] py-3 flex gap-[14px] items-center">
        <svg width="76" height="76" viewBox="0 0 76 76" className="shrink-0" aria-hidden>
          {arcs.map((a) => <circle key={a.label} cx="38" cy="38" r={r} fill="none" stroke={DONUT[a.color] ?? "#E4DAC4"} strokeWidth="11" strokeDasharray={`${a.len} ${C - a.len}`} strokeDashoffset={-a.off} transform="rotate(-90 38 38)" />)}
        </svg>
        <div className="flex-1 text-[10.5px] font-extrabold text-[#4A4436] leading-[1.9]">🟩 ETFs {p.allocation[0].pct}% · 🟧 Tech {p.allocation[1].pct}%<br />🟪 Energy {p.allocation[2].pct}% · 🟨 Consumer {p.allocation[3].pct}% · ⬜ Cash {p.allocation[4].pct}%</div>
      </Panel>
    </>
  );
}
