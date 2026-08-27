import Link from "next/link";
import type { ReactNode } from "react";
import type { Company, ClubConsensus, FicConsensus } from "@/lib/types";
import type { Dossier } from "@/lib/fixtures/v12-explore";
import { Eyebrow, Ticker } from "./bits";
import { money, pct } from "@/components/markets/format";
import { LineChart } from "@/components/markets/LineChart";

const capFmt = (n: number) => n >= 1e12 ? `$${(n / 1e12).toFixed(1)}T` : n >= 1e9 ? `$${(n / 1e9).toFixed(0)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : `$${n}`;

export function CompanyV12({ c, d, club, fic, watchers, clubLine, more }: { c: Company; d: Dossier; club?: ClubConsensus; fic?: FicConsensus; watchers: { initial: string; color: string }[]; clubLine: string; more: ReactNode }) {
  const up = c.changePct >= 0;
  const series = c.series?.["1M"] ?? c.series?.["1W"] ?? [];
  const num = (v: string, label: string, purple?: boolean) => <div className="bg-card border border-line rounded-[12px] px-3 py-[9px]"><div className="text-[13px] font-black text-ink">{v}</div><div className={`text-[8px] font-black tracking-[0.3px] ${purple ? "text-purple-2" : "text-ink-3"}`}>{label}</div></div>;
  return (
    <div className="pt-[14px] pb-[92px]">
      <div className="flex items-center gap-[10px]">
        <Link href="/discover" aria-label="Back" className="w-8 h-8 rounded-full bg-card border border-line flex items-center justify-center text-ink-2">‹</Link>
        <Ticker symbol={c.symbol} size={30} />
        <div className="flex-1 min-w-0"><div className="text-[15px] font-black text-ink">{c.name}</div><div className="text-[10px] font-bold text-ink-3">{d.exchange} · {d.sector}</div></div>
        <span className="text-ink-4">🔖</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2"><span className="text-[28px] font-black text-ink">{money(c.price)}</span><span className={`text-[12.5px] font-black ${up ? "text-[#3A8C4A]" : "text-red"}`}>{up ? "▲" : "▼"}{Math.abs(c.changePct).toFixed(1)}% today</span></div>
      {series.length > 1 && <div className="mt-1"><LineChart data={series} height={54} color={up ? "#3A8C4A" : "#C96A57"} /></div>}
      <Eyebrow className="mt-4">WHAT THE COMPANY DOES</Eyebrow>
      <p className="mt-1 text-[12.5px] font-bold text-[#4A4436] leading-[1.5]">{c.about && c.about.length > 40 && !d.does.includes("arrives") ? d.does : (d.does.includes("arrives") && c.about) || d.does}</p>
      <Eyebrow className="mt-4">KEY NUMBERS</Eyebrow>
      <div className="grid grid-cols-2 gap-2 mt-2">{num(d.numbers.pe, "P/E", true)}{num(d.numbers.revGrowth, "REV GROWTH")}{num(c.marketCap ? capFmt(Number(c.marketCap)) : d.numbers.mktCap, "MKT CAP")}{num(d.numbers.grossMargin, "GROSS MARGIN")}</div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-green-tint rounded-[13px] px-3 py-[10px]"><div className="text-[9px] font-black text-green">🐂 BULL CASE</div><p className="mt-1 text-[10.5px] font-bold text-[#4A4436] leading-[1.45]">{d.bull}</p></div>
        <div className="bg-[#F7E9E5] rounded-[13px] px-3 py-[10px]"><div className="text-[9px] font-black text-red">🐻 BEAR CASE</div><p className="mt-1 text-[10.5px] font-bold text-[#4A4436] leading-[1.45]">{d.bear}</p></div>
      </div>
      <Eyebrow className="mt-4">WHAT YOUR CLUB THINKS</Eyebrow>
      <Link href={`/club?tab=feed&filter=picks`} className="mt-2 bg-card border border-line rounded-[14px] px-3 py-[10px] flex items-center gap-2">
        <span className="flex -space-x-1">{watchers.slice(0, 3).map((w, i) => <span key={i} className="w-6 h-6 rounded-full text-white text-[10px] font-black flex items-center justify-center border-2 border-card" style={{ background: w.color }}>{w.initial}</span>)}</span>
        <span className="flex-1 text-[11px] font-bold text-[#4A4436]">{clubLine}</span><span className="text-[10px] font-black text-purple-2">Thread ›</span>
      </Link>
      <Eyebrow className="mt-4">WHAT FIC THINKS</Eyebrow>
      {fic ? (<><div className="mt-2 h-[7px] rounded-[7px] overflow-hidden flex"><span className="bg-green-2" style={{ width: `${fic.buyPct}%` }} /><span className="bg-gold" style={{ width: `${fic.watchPct}%` }} /><span className="bg-red" style={{ width: `${fic.passPct}%` }} /></div>
        <div className="mt-1 text-[10px] font-bold text-ink-2 flex gap-3"><span>🟢 {fic.buyPct}% Buy</span><span>🟡 {fic.watchPct}% Watch</span><span>🔴 {fic.passPct}% Pass · {fic.picks.toLocaleString()} picks</span></div></>)
        : <p className="mt-1 text-[10.5px] font-bold text-ink-3">No FIC picks on {c.symbol} yet — make the first one.</p>}
      {club && <p className="mt-1 text-[10px] font-bold text-ink-4">Club confidence {club.confidencePct}% · opinions, not advice</p>}
      <details className="mt-5"><summary className="text-[12px] font-black text-green cursor-pointer">More — chart, metrics, news</summary><div className="mt-3">{more}</div></details>
      <div className="absolute left-[18px] right-[86px] bottom-[96px] z-[30] flex items-center gap-2">
        <span className="w-[46px] h-[46px] rounded-[13px] bg-card border border-line flex items-center justify-center text-[16px] shadow">🔖</span>
        <span className="w-[46px] h-[46px] rounded-[13px] bg-card border border-line flex items-center justify-center text-[16px] shadow">👥</span>
        <Link href={`/club/pick/new?symbol=${c.symbol}`} className="flex-1 h-[46px] rounded-[13px] bg-green-2 text-cream-text text-[14px] font-black flex items-center justify-center shadow-[0_6px_16px_rgba(58,107,62,0.35)]">▲ Make a Pick</Link>
      </div>
    </div>
  );
}
