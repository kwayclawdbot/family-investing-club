"use client";
import Link from "next/link";
import { useState } from "react";
import { cx } from "@/components/ui";
import { myPerformance } from "@/lib/fixtures/v12-club";
import { LineChart } from "@/components/markets/LineChart";

type Tab = "picks" | "practice" | "verified";
const TILE: Record<string, string> = { green: "bg-green-tint text-green", gold: "bg-[#FFFDF4] text-[#BC9227]", orange: "bg-orange-tint text-orange-2" };
const series = [0, 2, 1.5, 4, 3.8, 6, 7.5, 7, 9, 11, 10.5, 13, 14.2, 16, 15.5, 18.2];

/** v12 — My Performance answers one question: my results (Picks | Practice | Verified). */
export function MyPerformance({ initialTab, connected, allocation, practiceValue, practicePct, holdings }: { initialTab: Tab; connected: boolean; allocation: { label: string; pct: number; color: string }[]; practiceValue: number; practicePct: number; holdings: number }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const m = myPerformance;
  return (
    <div className="pt-[14px] pb-6">
      <div className="flex items-center gap-3"><Link href="/profile" aria-label="Back" className="w-9 h-9 rounded-full bg-card border border-line flex items-center justify-center text-ink-2">‹</Link><span className="text-[16px] font-black text-ink">My Performance</span></div>
      <div className="mt-[10px] flex bg-[#EFE7D6] rounded-[12px] p-[3px]" role="tablist">
        {([["picks", "Picks"], ["practice", "Practice"], ["verified", "Verified ✓"]] as const).map(([id, l]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cx("flex-1 rounded-[9px] py-[7px] text-[12px]", tab === id ? "bg-[#FFFDF7] text-ink font-black shadow-[0_1px_3px_rgba(46,42,33,0.1)]" : "text-ink-3 font-extrabold")}>{l}</button>)}
      </div>
      {tab === "picks" && (
        <>
          <div className="mt-3"><span className="text-[34px] font-black text-[#3A8C4A]">+{m.ytdPct}%</span><span className="ml-2 text-[12.5px] font-extrabold text-ink-3">picks YTD · {m.active} active · vs S&amp;P +{m.spPct}%</span></div>
          <LineChart data={series} color="#3A8C4A" height={70} />
          <div className="flex gap-2 mt-[10px]">
            <div className="flex-1 bg-green-tint border border-green-line rounded-[13px] px-3 py-[10px]"><div className="text-[9px] font-black text-green">BEST PICK</div><div className="text-[13px] font-black text-ink mt-[2px]">{m.best.symbol} +{m.best.pct}%</div><div className="text-[9px] font-bold text-ink-3">&ldquo;{m.best.quote}&rdquo;</div></div>
            <div className="flex-1 bg-[#F7E9E5] border border-[#ECD4CC] rounded-[13px] px-3 py-[10px]"><div className="text-[9px] font-black text-red">WORST PICK</div><div className="text-[13px] font-black text-ink mt-[2px]">{m.worst.symbol} {m.worst.pct}%</div><div className="text-[9px] font-bold text-ink-3">&ldquo;{m.worst.quote}&rdquo; · {m.worst.note}</div></div>
          </div>
          <div className="mt-3 mb-[6px] text-[11px] font-black text-ink-3">PICK HISTORY · RESOLVED &amp; OPEN</div>
          <div className="bg-card border border-line rounded-[15px] px-[14px] py-[3px]">
            {m.history.map((h, i) => (
              <div key={h.symbol} className={cx("flex items-center gap-[9px] py-[9px]", i < m.history.length - 1 && "border-b border-paper-2")}>
                <span className={cx("w-7 h-7 rounded-[8px] flex items-center justify-center text-[8px] font-black", TILE[h.tone])}>{h.symbol}</span>
                <div className="flex-1"><div className="text-[12px] font-extrabold text-ink">{h.stance} · {h.date} · {h.horizon}</div><div className="text-[9px] font-bold text-ink-3">{h.sub}</div></div>
                <span className={cx("text-[12px] font-black", h.pct >= 0 ? "text-[#3A8C4A]" : "text-red")}>{h.pct >= 0 ? "+" : "−"}{Math.abs(h.pct)}%</span>
              </div>
            ))}
          </div>
          <p className="mt-[9px] text-center text-[10px] font-bold text-ink-4">Every pick is timestamped · accuracy counts resolved picks only</p>
        </>
      )}
      {tab === "practice" && (
        <>
          <div className="mt-3"><span className="text-[34px] font-black text-[#3A8C4A]">+{practicePct}%</span><span className="ml-2 text-[12.5px] font-extrabold text-ink-3">practice · ${practiceValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} · {holdings} holdings</span></div>
          <div className="flex gap-2 mt-[10px]">
            {[["BEST SCORE", `${m.practice.best}/15`, "Chart Rush"], ["GAMES PLAYED", String(m.practice.games), "this month"]].map(([l, v, s]) => <div key={l} className="flex-1 bg-card border border-line rounded-[13px] px-3 py-[10px]"><div className="text-[9px] font-black text-ink-3">{l}</div><div className="text-[13px] font-black text-ink mt-[2px]">{v}</div><div className="text-[9px] font-bold text-ink-3">{s}</div></div>)}
          </div>
          <Link href="/practice" className="mt-3 block text-center bg-green text-cream-text rounded-[12px] py-3 text-[13px] font-black">Open Practice</Link>
          <p className="mt-[9px] text-center text-[10px] font-bold text-ink-4">Practice results feed the Practice leaderboard · never mixed with real returns</p>
        </>
      )}
      {tab === "verified" && (connected ? (
        <>
          <div className="mt-3 text-[11px] font-black text-ink-3">VERIFIED ALLOCATION · ONLY YOU</div>
          <div className="mt-2 flex h-3 rounded-[6px] overflow-hidden">{allocation.map((a) => <span key={a.label} className={a.color} style={{ width: `${a.pct}%` }} />)}</div>
          <div className="mt-2 text-[10.5px] font-extrabold text-[#4A4436] leading-[1.9]">{allocation.map((a) => `${a.label} ${a.pct}%`).join(" · ")}</div>
          <Link href="/profile/portfolio" className="mt-3 block text-center bg-card border border-line rounded-[12px] py-3 text-[13px] font-black text-ink">My Portfolio ›</Link>
        </>
      ) : (
        <div className="mt-4 bg-card border border-line rounded-[16px] px-5 py-8 text-center"><div className="text-[26px]">📊</div><div className="mt-2 text-[15px] font-black text-ink">No verified performance yet</div><p className="mt-1 text-[12.5px] font-bold text-ink-3">Connect a brokerage (read-only) to see it here. Everything else works without it.</p><Link href="/profile/brokerage" className="inline-flex mt-4 h-9 px-4 items-center rounded-[12px] bg-green text-cream-text text-[13px] font-black">Verify your holdings</Link></div>
      ))}
    </div>
  );
}
