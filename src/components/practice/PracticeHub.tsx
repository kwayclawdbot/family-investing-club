"use client";
import Link from "next/link";
import { useState } from "react";
import { practiceGames } from "@/lib/fixtures/v12-explore";
import { money, pct } from "@/components/markets/format";
import { Sparkline } from "@/components/markets/LineChart";
import { Eyebrow } from "@/components/markets/v12/bits";

const CHIPS = ["Games", "Charts", "Scenarios", "Portfolio"] as const;
export function PracticeHub({ portfolio, embedded }: { portfolio: { value: number; changePct: number; holdings: number; series: number[] }; embedded?: boolean }) {
  const [chip, setChip] = useState<(typeof CHIPS)[number]>("Games");
  const games = chip === "Charts" ? practiceGames.filter((g) => g.id === "chart-rush") : chip === "Scenarios" ? [] : practiceGames;
  return (
    <div className={embedded ? "" : "pt-[14px] pb-6"}>
      {!embedded && <><h1 className="text-[21px] font-black text-ink">Practice</h1>
      <p className="text-[11px] font-bold text-ink-3">Apply what you know — zero real money</p></>}
      <div className="mt-3 rounded-[12px] bg-[#EFE7D6] p-[3px] flex">{CHIPS.map((c) => <button key={c} onClick={() => setChip(c)} className={`flex-1 h-[30px] rounded-[9px] text-[11.5px] font-bold ${chip === c ? "bg-[#FFFDF7] text-ink font-black shadow-sm" : "text-ink-3"}`}>{c}</button>)}</div>
      {chip === "Scenarios" && <Link href="/learn/scenarios" className="mt-3 block bg-card border border-line rounded-[15px] px-4 py-3 text-[13px] font-black text-ink">Scenario lessons → decide under pressure, then review ›</Link>}
      {chip === "Portfolio" && <Link href="/practice/portfolio" className="mt-3 block bg-card border border-line rounded-[15px] px-4 py-3 text-[13px] font-black text-ink">Open your practice portfolio ›</Link>}
      {chip !== "Portfolio" && chip !== "Scenarios" && (<>
        <div className="mt-3 rounded-[16px] border border-purple-line px-4 py-3 flex items-center gap-3" style={{ background: "linear-gradient(105deg,#EFEBF8,#F5F1FA)" }}>
          <span className="w-11 h-11 rounded-[13px] bg-purple flex items-center justify-center text-[19px]">🎯</span>
          <div className="flex-1"><div className="text-[10px] font-black text-purple-2">FROM YOUR LAST LESSON</div><div className="text-[14px] font-black text-ink">Practice valuation: cheap or expensive?</div><div className="text-[10px] font-bold text-ink-3">6 rounds · real companies · +15 XP</div></div>
          <Link href="/learn/games/valuation" className="rounded-[11px] bg-purple text-cream-text px-3 py-[7px] text-[11px] font-black">Play</Link>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">{games.map((g) => <Link key={g.id} href={g.href} className="bg-card border border-line rounded-[15px] px-3 py-3"><div className="text-[20px]">{g.emoji}</div><div className="text-[13px] font-black text-ink mt-1">{g.title}</div><div className="text-[9.5px] font-bold text-ink-3">{g.sub}</div></Link>)}</div>
      </>)}
      <Eyebrow className="mt-4 mb-2">YOUR PRACTICE PORTFOLIO</Eyebrow>
      <div className="bg-card border border-line rounded-[15px] px-4 py-3 flex items-center gap-3">
        <div className="flex-1"><Link href="/practice/portfolio" className="text-[17px] font-black text-ink">{money(portfolio.value, 0)} <span className="text-[11px] text-[#3A8C4A]">{pct(portfolio.changePct, 2)}</span></Link><div className="text-[10px] font-bold text-ink-3">{portfolio.holdings} holdings · <Link href="/practice/trade/CEG" className="text-green">try your club&apos;s CEG thesis here first</Link></div></div>
        <Link href="/practice/portfolio" aria-label="Open practice portfolio"><Sparkline data={portfolio.series} width={70} height={26} color="#E58234" /></Link>
      </div>
      <p className="mt-4 text-center text-[10px] font-bold text-ink-4">Practice results feed the Practice leaderboard · never mixed with real returns</p>
    </div>
  );
}
