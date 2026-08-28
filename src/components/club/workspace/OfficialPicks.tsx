"use client";
import Link from "next/link";
import { useState } from "react";
import { cx } from "@/components/ui";
import { officialPicks, decisionRows, kaiClubSummary } from "@/lib/fixtures/v14-home";
import { openSheet } from "@/components/sheets/bus";

const TONE: Record<string, string> = { BUY: "bg-green-tint text-green", CORE: "bg-paper-2 text-ink-2", WATCH: "bg-orange-tint text-orange-2" };

/** Prototype v3 `clubperf`: OFFICIAL CLUB PICKS · YTD — the picks the club voted in. */
export function OfficialPicks() {
  const o = officialPicks; const [range, setRange] = useState("YTD");
  return (
    <div>
      <div className="flex items-baseline justify-between"><span className="text-[10px] font-black tracking-[0.5px] text-ink-3">OFFICIAL CLUB PICKS · YTD</span><span className="text-[10px] font-extrabold text-ink-4">{o.count} picks · {o.open} open</span></div>
      <div className="mt-1 flex items-baseline gap-2"><span className="text-[30px] font-black text-green-2">+{o.ytdPct}%</span><span className="text-[11px] font-extrabold text-ink-3">vs S&P +{o.benchPct}%</span></div>
      <div className="mt-2 flex items-center gap-[6px]">{o.ranges.map((r) => <button key={r} onClick={() => setRange(r)} className={cx("h-[24px] px-[10px] rounded-[8px] text-[10px] font-black", range === r ? "bg-ink text-cream-text" : "bg-card border border-line text-ink-3")}>{r}</button>)}<span className="ml-auto text-[9.5px] font-extrabold text-ink-4">{o.markers}</span></div>
      <div className="mt-2 grid grid-cols-3 gap-2">{o.tiles.map(([v, l, s]) => <div key={l} className="rounded-[12px] border border-line bg-card px-2 py-[9px] text-center"><div className="text-[16px] font-black text-ink">{v}</div><div className="text-[8.5px] font-black tracking-[0.4px] text-ink-4">{l}</div><div className="text-[9px] font-bold text-ink-3">{s}</div></div>)}</div>
      <div className="mt-[13px] mb-[6px] flex items-baseline justify-between"><span className="text-[10px] font-black tracking-[0.5px] text-ink-3">OFFICIAL CLUB PICKS</span><span className="text-[9.5px] font-extrabold text-ink-4">voted in by the club</span></div>
      <div className="rounded-[14px] border border-line bg-card px-3">
        {o.rows.map((r, i) => (
          <Link key={r.symbol} href={`/discover/${r.symbol}`} className={cx("flex items-center gap-[10px] py-[9px]", i < o.rows.length - 1 && "border-b border-paper-2")}>
            <span className="w-9 h-9 rounded-[9px] bg-paper-2 flex items-center justify-center text-[9px] font-black text-ink-2">{r.symbol}</span>
            <span className="flex-1 min-w-0"><span className="flex items-center gap-[6px]"><span className="text-[13px] font-black text-ink">{r.name}</span><span className={cx("rounded-[5px] px-[5px] py-[1px] text-[8.5px] font-black", TONE[r.stance])}>{r.stance}</span></span><span className="block text-[10px] font-bold text-ink-3">{r.line}</span></span>
            <span className={cx("text-[13px] font-black", r.pct >= 0 ? "text-green-2" : "text-red")}>{r.pct >= 0 ? "+" : "−"}{Math.abs(r.pct)}%</span>
          </Link>
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] font-bold text-ink-4">{o.footnote}</p>
    </div>
  );
}

/** Prototype v3 `clubdec`: MY DECISION RECORD rows + footnote. */
export function DecisionRecordRows() {
  return (
    <div className="mt-2">
      {decisionRows.map((r, i) => (
        <div key={r.symbol} className={cx("flex items-center gap-[9px] py-[8px]", i < decisionRows.length - 1 && "border-b border-paper-2")}>
          <span className="w-8 h-8 rounded-[8px] bg-paper-2 flex items-center justify-center text-[8.5px] font-black text-ink-2">{r.symbol}</span>
          <span className="flex-1 min-w-0 text-[11px] font-bold text-ink-2"><span className="block"><span className="text-ink">You voted </span><b className="text-green">{r.vote}</b> · {r.what} <span className="text-ink-4">· {r.date}</span></span><span className="block text-[10px] text-ink-3">{r.result}</span></span>
          <span className="text-right"><span className={cx("block text-[12px] font-black", r.pct.startsWith("−") ? "text-red" : "text-green-2")}>{r.pct}</span><span className="block text-[9px] font-extrabold text-ink-4">{r.verdict}</span></span>
        </div>
      ))}
      <p className="mt-2 text-center text-[9.5px] font-bold text-ink-4">&ldquo;Aged well&rdquo; = outcome moved with your vote 90+ days later · learning metric, not a score</p>
    </div>
  );
}

/** Prototype v3 `clubchat`: Kai ✦ summary message. */
export function KaiSummaryRow() {
  return (
    <div className="my-2 flex items-start gap-[9px]">
      <span className="w-[26px] h-[26px] rounded-full bg-purple-2 text-cream-text text-[11px] font-black flex items-center justify-center shrink-0">K</span>
      <div className="flex-1 rounded-[12px] border border-purple-line bg-purple-tint px-3 py-[9px]">
        <div className="text-[10px] font-black text-purple-2">Kai ✦ · summary</div>
        <div className="text-[12px] font-bold text-ink-2">{kaiClubSummary} <button type="button" onClick={() => openSheet("kai")} className="text-purple-2 font-black">Ask me anything →</button></div>
      </div>
    </div>
  );
}
