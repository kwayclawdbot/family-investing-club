"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { myPerf } from "@/lib/fixtures/v13-learn";

type Tab = "picks" | "practice" | "verified";
const T = "bg-card border border-line rounded-[12px] px-[9px] py-2 text-center";
export function MyPerformanceV13({ tab, practice, connected, allocation }: { tab: Tab; practice: { value: number; pct: number; holdings: number }; connected: boolean; allocation: { label: string; pct: number; color: string }[] }) {
  const router = useRouter(); const [range, setRange] = useState("YTD"); const m = myPerf;
  const W = 330, H = 70; const mn = Math.min(...m.series), mx = Math.max(...m.series);
  const path = m.series.map((v, k) => `${k === 0 ? "M" : "L"}${(k / (m.series.length - 1)) * W},${H - ((v - mn) / (mx - mn || 1)) * (H - 10) - 5}`).join(" ");
  return (
    <div className="pt-[14px] pb-8">
      <div className="flex items-center gap-2"><Link href="/profile" className="text-ink-2 text-[18px]">‹</Link><div><h1 className="text-[19px] font-black text-ink">My Performance</h1><div className="text-[10px] font-bold text-ink-3">resolved picks only count</div></div></div>
      <div className="mt-[10px] flex gap-[3px] bg-[#F1EADB] rounded-[12px] p-[3px]" role="tablist">{(["picks", "practice", "verified"] as Tab[]).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => router.replace(`/profile/performance?tab=${t}`)} className={`flex-1 rounded-[9px] py-[6px] text-[11px] font-extrabold ${tab === t ? "bg-card text-ink shadow-sm" : "text-ink-3"}`}>{t === "picks" ? "Picks" : t === "practice" ? "Practice" : "Verified ✓"}</button>)}</div>
      {tab === "picks" && (<>
        <div className="mt-3 text-[10px] font-black text-ink-3">PICK PERFORMANCE · YTD · {m.picks} picks · {m.open} open · {m.resolved} resolved</div>
        <div className="flex items-baseline gap-2 mt-1"><span className="text-[30px] font-black text-green">+{m.ytdPct}%</span><span className="text-[11px] font-extrabold text-ink-3">vs S&amp;P +{m.benchPct}%</span></div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} aria-hidden className="mt-1"><path d={path} fill="none" stroke="#3A6B3E" strokeWidth="2.5" strokeLinejoin="round" /></svg>
        <div className="flex gap-[6px] mt-1">{["1M", "3M", "YTD", "ALL"].map((r) => <button key={r} onClick={() => setRange(r)} className={`px-3 h-[26px] rounded-[9px] text-[11px] font-black ${range === r ? "bg-ink text-cream-text" : "text-ink-3"}`}>{r}</button>)}</div>
        <div className="flex gap-2 mt-3">{m.tiles.map((t) => <div key={t.l} className={`flex-1 ${T}`}><div className={`text-[13px] font-black ${t.c}`}>{t.v}</div><div className="text-[7.5px] font-extrabold text-ink-3">{t.l}</div><div className="text-[7px] font-bold text-ink-4">{t.s}</div></div>)}</div>
        <div className="flex gap-2 mt-3">
          <div className="flex-1 rounded-[14px] border border-green-line bg-green-tint px-3 py-[10px]"><div className="text-[9px] font-black text-green">BEST PICK</div><div className="text-[15px] font-black text-ink">{m.best.symbol} <span className="text-green">+{m.best.pct}%</span></div><div className="text-[10px] font-bold text-ink-3">&quot;{m.best.quote}&quot;</div></div>
          <div className="flex-1 rounded-[14px] border border-[#E5B8AE] bg-[#FBEDE9] px-3 py-[10px]"><div className="text-[9px] font-black text-red">WORST PICK</div><div className="text-[15px] font-black text-ink">{m.worst.symbol} <span className="text-red">{m.worst.pct}%</span></div><div className="text-[10px] font-bold text-ink-3">&quot;{m.worst.quote}&quot; · {m.worst.note}</div></div>
        </div>
        <div className="mt-3 text-[10px] font-black text-ink-3">STANCE MIX · {m.picks} PICKS</div>
        <div className="mt-1 flex h-[10px] rounded-[5px] overflow-hidden"><span className="bg-green-2" style={{ flex: m.stance.buy }} /><span className="bg-gold" style={{ flex: m.stance.watch }} /><span className="bg-[#C96A57]" style={{ flex: m.stance.pass }} /></div>
        <div className="flex gap-3 mt-1 text-[10px] font-extrabold text-ink-2"><span>▲ Buy {m.stance.buy}</span><span>👁 Watch {m.stance.watch}</span><span>✕ Pass {m.stance.pass}</span></div>
        <div className="mt-3 text-[10px] font-black text-ink-3">PICK HISTORY · TAP ANY FOR THE PICK CARD</div>
        <div className="mt-1 bg-card border border-line rounded-[15px] px-[14px] py-[3px]">{m.history.map((h, i) => (
          <Link key={h.id} href={`/club/pick/${h.id}`} className={`flex items-center gap-3 py-[10px] ${i < m.history.length - 1 ? "border-b border-paper-2" : ""}`}>
            <span className="w-10 h-8 rounded-[8px] bg-paper-2 text-[10px] font-black text-ink-2 flex items-center justify-center">{h.symbol}</span>
            <div className="flex-1"><div className="text-[12px] font-extrabold text-ink">{h.line}</div><div className="text-[9.5px] font-bold text-ink-3">{h.sub}</div></div>
            <span className={`text-[12px] font-black ${h.pct >= 0 ? "text-green" : "text-red"}`}>{h.pct >= 0 ? "+" : ""}{h.pct}%</span>
          </Link>))}</div>
        <div className="mt-3 text-center text-[9.5px] font-bold text-ink-4">Every pick is timestamped · accuracy counts resolved picks only</div>
      </>)}
      {tab === "practice" && (<>
        <div className="mt-3 bg-card border border-line rounded-[16px] px-4 py-3"><div className="text-[10px] font-black text-ink-3">PRACTICE PORTFOLIO · VIRTUAL</div><div className="text-[26px] font-black text-ink">${practice.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className={`text-[13px] ${practice.pct >= 0 ? "text-green" : "text-red"}`}>{practice.pct >= 0 ? "+" : ""}{practice.pct}%</span></div><div className="text-[10.5px] font-bold text-ink-3">{practice.holdings} holdings · results feed the Practice leaderboard · never mixed with real returns</div></div>
        <Link href="/practice/portfolio" className="mt-3 block w-full h-[46px] rounded-[14px] bg-green text-cream-text text-[14px] font-black text-center leading-[46px]">Open practice portfolio</Link>
      </>)}
      {tab === "verified" && (connected ? (<div className="mt-3 bg-card border border-line rounded-[16px] px-4 py-3"><div className="text-[10px] font-black text-ink-3">VERIFIED ALLOCATION · ONLY YOU</div>{allocation.map((a) => <div key={a.label} className="flex items-center gap-2 py-1 text-[12px] font-extrabold text-ink"><span className={`w-3 h-3 rounded-[4px] ${a.color}`} />{a.label}<span className="ml-auto text-ink-3">{a.pct}%</span></div>)}</div>)
        : (<div className="mt-3 rounded-[16px] border border-line bg-card px-5 py-7 text-center"><div className="text-[26px]">🔒</div><div className="mt-2 text-[14px] font-black text-ink">Connect a brokerage to see verified performance</div><div className="mt-1 text-[11px] font-bold text-ink-3">Read-only · optional · everything else works without it</div><Link href="/profile/brokerage" className="inline-block mt-3 rounded-[12px] bg-green text-cream-text px-4 py-2 text-[12px] font-black">Verify holdings</Link></div>))}
    </div>
  );
}
