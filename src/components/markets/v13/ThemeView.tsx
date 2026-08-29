"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo, Pct, Signed, BackBar, FicBar, Label } from "./bits";
import type { Theme } from "@/lib/content/themes";
import type { ThemeStats } from "@/lib/live/discover";
import type { Quote } from "./DiscoverV13";
import { openSheet } from "@/components/sheets/bus";

function Spark({ data }: { data: number[] }) {
  const min = Math.min(...data), max = Math.max(...data); const W = 340, H = 70;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - 6 - ((v - min) / (max - min || 1)) * (H - 14)}`).join(" ");
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-2">
      <defs><linearGradient id="thg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4C8C4A" stopOpacity="0.25" /><stop offset="100%" stopColor="#4C8C4A" stopOpacity="0" /></linearGradient></defs>
      <polygon fill="url(#thg)" points={`0,${H} ${pts} ${W},${H}`} /><polyline fill="none" stroke="#4C8C4A" strokeWidth={2.6} points={pts} />
    </svg>
  );
}

/** Theme — prototype v2 `theme`: basket performance, why it's moving, bull/bear, companies, FIC consensus, actions. */
const signed = (n: number | null | undefined, d = 1) => (n === null || n === undefined ? "—" : `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(d)}%`);

export function ThemeView({ t, stats, quotes }: { t: Theme; stats: ThemeStats | null; quotes: Record<string, Quote | undefined> }) {
  const router = useRouter();
  return (
    <div className="pt-[14px] pb-[84px] relative">
      <div className="flex items-center gap-[11px]">
        <BackBar title="" />
        <span className="w-9 h-9 rounded-[12px] flex items-center justify-center text-[17px] shadow-[0_2px_6px_rgba(229,130,52,0.35)]" style={{ background: "linear-gradient(120deg,#E9C46A,#E58234)" }}>{t.emoji}</span>
        <div className="flex-1"><div className="text-[15px] font-black text-ink">{t.name}</div><div className="text-[9.5px] font-extrabold text-ink-3">Theme · {t.companies.length} companies{stats?.picks ? ` · ${stats.picks} FIC ${stats.picks === 1 ? "pick" : "picks"}` : ""}</div></div>
        <button aria-label="Save theme" className="text-ink-4">🔖</button>
      </div>
      <div className="mt-[9px] flex items-baseline gap-2">
        <span className={`text-[26px] font-black ${(stats?.basketPct ?? 0) >= 0 ? "text-[#3A8C4A]" : "text-red"}`}>{signed(stats?.basketPct)}</span>
        <span className="text-[11px] font-extrabold text-ink-3">equal-weight basket · 1Y</span>
        <span className="ml-auto text-[9.5px] font-extrabold text-ink-3">vs S&amp;P <b className="text-orange-2">{signed(stats?.benchmarkPct)}</b></span>
      </div>
      {stats?.series && stats.series.length > 1 ? <Spark data={stats.series} /> : <p className="mt-2 text-[10.5px] font-bold text-ink-4 text-center">No price history for this basket yet.</p>}
      <Label className="mt-3 mb-[6px]">WHY THIS THEME IS MOVING</Label>
      <p className="text-[12px] font-semibold text-ink-2 leading-[1.5]">{t.why}</p>
      <div className="flex gap-[7px] mt-[9px]">
        <div className="flex-1 bg-green-tint border border-green-line rounded-[12px] px-[10px] py-2"><div className="text-[8.5px] font-black text-green">🐂 BULL</div><div className="text-[9.5px] font-bold text-ink-2 leading-[1.4] mt-[2px]">{t.bull}</div></div>
        <div className="flex-1 bg-[#F7E9E5] border border-[#ECD4CC] rounded-[12px] px-[10px] py-2"><div className="text-[8.5px] font-black text-red">🐻 BEAR</div><div className="text-[9.5px] font-bold text-ink-2 leading-[1.4] mt-[2px]">{t.bear}</div></div>
      </div>
      <Label className="mt-3 mb-[6px]">THE COMPANIES</Label>
      <div className="bg-card border border-line rounded-[15px] px-[14px] py-[3px]">
        {t.companies.map((c, i) => {
          const q = quotes[c.symbol];
          return (
            <Link key={c.symbol} href={`/discover/${c.symbol}`} className={`flex items-center gap-[10px] py-[9px] ${i < t.companies.length - 1 ? "border-b border-paper-2" : ""}`}>
              <Logo symbol={c.symbol} size={32} radius={10} />
              <div className="flex-1 min-w-0"><div className="text-[12.5px] font-black text-ink">{c.name}</div><div className="text-[9px] font-bold text-ink-3 truncate">{c.line}</div></div>
              {q && <span className="text-right"><div className="text-[10.5px] font-black text-ink">${q.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div><Pct v={q.changePct} className="text-[8px]" /></span>}
              {stats?.per[c.symbol] === null || stats?.per[c.symbol] === undefined ? <span className="w-[46px] text-right text-[11.5px] font-black text-ink-4">—</span> : <Signed v={stats.per[c.symbol]!} className="w-[46px] text-right text-[11.5px]" />}
            </Link>
          );
        })}
      </div>
      {!!stats?.picks && stats.buyPct !== null && (
        <>
          <Label className="mt-3 mb-[6px]">WHAT FIC THINKS</Label>
          <div className="bg-card border border-line rounded-[13px] px-3 py-[9px]">
            <FicBar buy={stats.buyPct} watch={stats.watchPct ?? 0} />
            <div className="flex justify-between mt-1 text-[9px] font-extrabold text-ink-2"><span>🟢 {stats.buyPct}% Buy</span><span>🟡 {stats.watchPct}% Watch</span><span>🔴 {stats.passPct}% · {stats.picks.toLocaleString()} {stats.picks === 1 ? "pick" : "picks"}</span></div>
            <p className="mt-[6px] text-[9px] font-bold text-ink-4">Across every FIC club that has picked one of these companies.</p>
          </div>
        </>
      )}
      <div className="absolute left-0 right-0 bottom-3 flex gap-2">
        <button aria-label="Ask Kai" onClick={() => openSheet("kai", { context: `theme:${t.id}` })} className="w-11 h-11 rounded-[13px] bg-purple text-white flex items-center justify-center text-[16px]">✦</button>
        <button onClick={() => router.push("/club?tab=decisions")} className="flex-1 bg-card border-[1.5px] border-green-2 text-green rounded-[13px] py-[13px] text-[13px] font-black">Research with club</button>
        <button onClick={() => openSheet("pick", { symbol: t.companies[0].symbol })} className="flex-1 bg-green-2 text-cream-text rounded-[13px] py-[13px] text-[13px] font-black shadow-[0_3px_0_#3A6B3E]">▲ Pick a company</button>
      </div>
    </div>
  );
}
