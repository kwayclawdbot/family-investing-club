"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo, Pct, CashText, Label } from "./bits";
import type { Metric } from "@/lib/types";
import { openSheet } from "@/components/sheets/bus";

type Range = "1D" | "1W" | "1Y" | "5Y";
export type ClubCase = { by: string; text: string };
export type CompanyV13Props = {
  symbol: string; name: string; price: number; changePct: number; series: Record<string, number[] | undefined>;
  sector: string | null; about: string | null; understand: string[];
  /** The live key metrics (`lib/market` → Polygon): market cap, P/E, dividend yield, 52-week range, volume. */
  metrics: Metric[];
  /** The club's own case — its members' picks on this company. Empty until somebody makes one. */
  bull: ClubCase[]; bear: ClubCase[];
  circle: { slug: string; name: string; daysLeft: number } | null;
  club: { line: string; sub: string; avatars: { initial: string; color: string; ring: string }[]; hasPick: boolean; hasHolding: boolean };
  fic: { buy: number; watch: number; pass: number; picks: number; verified: number } | null;
  newsLine?: string;
};

function Chart({ data, markers }: { data: number[]; markers: { idx: number; color: string }[] }) {
  const W = 340, H = 96; const min = Math.min(...data), max = Math.max(...data);
  const xy = (i: number) => [(i / (data.length - 1)) * W, H - 18 - ((data[i] - min) / (max - min || 1)) * (H - 30)] as const;
  const pts = data.map((_, i) => xy(i).join(",")).join(" ");
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-1">
      <defs><linearGradient id="cvg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4C8C4A" stopOpacity="0.25" /><stop offset="100%" stopColor="#4C8C4A" stopOpacity="0" /></linearGradient></defs>
      <polygon fill="url(#cvg)" points={`0,${H} ${pts} ${W},${H}`} /><polyline fill="none" stroke="#4C8C4A" strokeWidth={2.8} points={pts} />
      {markers.map((m, k) => { const [x, y] = xy(Math.min(data.length - 1, Math.max(0, m.idx))); return <circle key={k} cx={x} cy={y} r={4.5} fill={m.color} stroke="#FFFDF7" strokeWidth={1.5} />; })}
    </svg>
  );
}

/** Company — prototype v2 `company`: understand + club + FIC + Kai, ＋ handled by the shell FAB. */
export function CompanyV13(p: CompanyV13Props) {
  const [range, setRange] = useState<Range>("1Y");
  const [fetched, setFetched] = useState<Partial<Record<Range, number[]>>>({});
  const local = p.series[range];
  const data = (local && local.length > 1 ? local : fetched[range]) ?? p.series["1M"] ?? [p.price * 0.97, p.price];
  useEffect(() => {
    if ((local && local.length > 1) || fetched[range]) return;
    let alive = true;
    fetch(`/api/market/series?symbol=${p.symbol}&range=${range}`).then((r) => r.json()).then((j) => { if (alive && Array.isArray(j.closes) && j.closes.length > 1) setFetched((f) => ({ ...f, [range]: j.closes })); }).catch(() => {});
    return () => { alive = false; };
  }, [range, local, fetched, p.symbol]);
  const markers = [p.club.hasPick ? { idx: Math.floor(data.length * 0.3), color: "#8B7BC7" } : null, p.club.hasHolding ? { idx: Math.floor(data.length * 0.7), color: "#E58234" } : null].filter(Boolean) as { idx: number; color: string }[];
  const tile = "flex-1 bg-card border border-line rounded-[12px] px-[9px] py-[7px]";
  const shown = p.metrics.filter((m) => m.value && m.value !== "—").slice(0, 4);
  return (
    <div className="pt-[14px] pb-[90px]">
      <div className="flex items-center gap-[11px]">
        <Link href="/discover" aria-label="Back" className="text-ink-2"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg></Link>
        <Logo symbol={p.symbol} size={36} radius={12} />
        <div className="flex-1"><div className="text-[15px] font-black text-ink">{p.name}</div><div className="text-[9.5px] font-extrabold text-ink-3">{p.sector ?? p.symbol}</div></div>
        <button aria-label="Save" className="text-ink-4">🔖</button>
      </div>
      <div className="mt-[9px] flex items-baseline gap-2">
        <span className="text-[30px] font-black text-ink">${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <Pct v={p.changePct} className="text-[12.5px]" />
        <span className="ml-auto text-[9px] font-extrabold text-ink-3">{p.club.hasPick && <><span className="text-purple">●</span> your pick</>}{p.club.hasPick && p.club.hasHolding && " · "}{p.club.hasHolding && <><span className="text-orange">●</span> club buy</>}</span>
      </div>
      <Chart data={data} markers={markers} />
      <div className="flex gap-1 mt-[3px] items-center">
        {(["1D", "1W", "1Y", "5Y"] as Range[]).map((r) => <button key={r} onClick={() => setRange(r)} className={range === r ? "bg-ink text-cream-text rounded-[8px] px-[10px] py-[3px] text-[10px] font-black" : "text-ink-4 px-[7px] py-[3px] text-[10px] font-extrabold"}>{r}</button>)}
        {p.circle && <Link href={`/circle/${p.circle.slug}`} className="ml-auto text-[9.5px] font-black text-purple-2">📊 {p.circle.name} circle · {p.circle.daysLeft}d ›</Link>}
      </div>
      {!!shown.length && (
        <div className="flex gap-[7px] mt-[9px]">
          {shown.map((m) => (
            <div key={m.key} className={tile} title={m.definition}>
              <div className="text-[12.5px] font-black text-ink truncate">{m.value}</div>
              <div className="text-[7.5px] font-extrabold text-ink-3 uppercase truncate">{m.label}</div>
            </div>
          ))}
        </div>
      )}
      {p.about && (
        <div className="mt-[9px] bg-card border border-line rounded-[13px] px-3 py-[9px]">
          <div className="text-[8.5px] font-black text-ink-3">WHAT IT DOES</div>
          <p className="mt-[5px] text-[11px] font-semibold text-ink-2 leading-[1.5]">{p.about}</p>
        </div>
      )}
      {/* The case for and against is the club's own — its members' picks, in their words. */}
      <div className="flex gap-[7px] mt-[9px]">
        <div className="flex-1 bg-green-tint border border-green-line rounded-[12px] px-[10px] py-2">
          <div className="text-[8.5px] font-black text-green">🐂 BULL · YOUR CLUB</div>
          {p.bull.length ? p.bull.slice(0, 2).map((c, i) => <div key={i} className="text-[9.5px] font-bold text-ink-2 leading-[1.4] mt-[2px]">&ldquo;{c.text}&rdquo; <span className="text-ink-4">— {c.by}</span></div>)
            : <div className="text-[9.5px] font-bold text-ink-4 leading-[1.4] mt-[2px]">No bull case yet — make the first pick.</div>}
        </div>
        <div className="flex-1 bg-[#F7E9E5] border border-[#ECD4CC] rounded-[12px] px-[10px] py-2">
          <div className="text-[8.5px] font-black text-red">🐻 BEAR · YOUR CLUB</div>
          {p.bear.length ? p.bear.slice(0, 2).map((c, i) => <div key={i} className="text-[9.5px] font-bold text-ink-2 leading-[1.4] mt-[2px]">&ldquo;{c.text}&rdquo; <span className="text-ink-4">— {c.by}</span></div>)
            : <div className="text-[9.5px] font-bold text-ink-4 leading-[1.4] mt-[2px]">Nobody has argued the other side yet.</div>}
        </div>
      </div>
      <Link href="/club?tab=performance" className="mt-[9px] bg-card border border-line rounded-[13px] px-3 py-[9px] flex items-center gap-[9px]">
        <span className="flex">{p.club.avatars.map((a, i) => <span key={i} className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[9px] font-black shadow-[0_0_0_2px_#FFFDF7] shrink-0" style={{ background: a.color, border: `2.5px solid ${a.ring}`, marginLeft: i ? -7 : 0 }}>{a.initial}</span>)}</span>
        <div className="flex-1 min-w-0"><div className="text-[10.5px] font-black text-ink truncate">{p.club.line}</div><div className="text-[8.5px] font-bold text-ink-3 truncate">{p.club.sub}</div></div>
        <span className="text-[9.5px] font-black text-purple-2">Thread ›</span>
      </Link>
      {p.fic && (
        <div className="mt-[9px] bg-card border border-line rounded-[13px] px-3 py-[9px]">
          <div className="flex justify-between items-center"><span className="text-[8.5px] font-black text-ink-3">FIC CONSENSUS · {p.fic.picks.toLocaleString()} PICKS</span><span className="text-[8.5px] font-black text-green">{p.fic.verified.toLocaleString()} verified ✓</span></div>
          <div className="flex h-[13px] rounded-[7px] overflow-hidden mt-[6px]"><span style={{ width: `${p.fic.buy}%`, background: "#4C8C4A" }} /><span style={{ width: `${p.fic.watch}%`, background: "#E9C46A" }} /><span className="flex-1" style={{ background: "#C96A57" }} /></div>
          <div className="flex justify-between mt-1 text-[9px] font-extrabold text-ink-2"><span>🟢 {p.fic.buy}% Buy</span><span>🟡 {p.fic.watch}% Watch</span><span>🔴 {p.fic.pass}% Pass</span></div>
        </div>
      )}
      {p.newsLine && (
        <Link href="/discover/news" className="mt-[9px] bg-[#FBF6EA] border border-[#EFE4CF] rounded-[12px] px-3 py-[9px] flex items-center gap-[9px]">
          <span className="text-[13px]">📰</span><span className="flex-1 text-[10.5px] font-extrabold text-ink"><CashText text={p.newsLine} /></span><span className="text-[9.5px] font-black text-orange-2">why it matters ›</span>
        </Link>
      )}
      <Label className="mt-3 mb-[6px]">UNDERSTAND {p.name.toUpperCase()}</Label>
      <div className="bg-card border border-line rounded-[14px] px-[14px] py-[2px]">
        {p.understand.map((u, i) => {
          const isPe = /expensive/i.test(u);
          const inner = <><span className="text-orange font-black">＋</span><span className="flex-1 text-[11.5px] font-extrabold text-ink">{u} {isPe && <span className="bg-purple-tint text-purple-2 rounded-[7px] px-[7px] py-[1px] text-[8.5px] font-black">P/E LESSON</span>}</span></>;
          const cls = `flex items-center gap-[10px] py-[9px] w-full text-left ${i < p.understand.length - 1 ? "border-b border-paper-2" : ""}`;
          return isPe ? <Link key={u} href="/lesson/valuation" className={cls}>{inner}</Link> : <button key={u} onClick={() => openSheet("kai", { context: `symbol:${p.symbol}`, q: u })} className={cls}>{inner}</button>;
        })}
      </div>
      <button onClick={() => openSheet("kai", { context: `symbol:${p.symbol}` })} className="mt-2 w-full bg-purple-tint border border-purple-line rounded-[12px] px-3 py-2 flex items-center gap-[9px] text-left">
        <span className="w-6 h-6 rounded-[8px] bg-purple text-white flex items-center justify-center text-[11px]">✦</span>
        <span className="flex-1 text-[10.5px] font-bold text-[#584A93]">Ask Kai anything about {p.name} — it knows what you’re looking at</span>
        <span className="text-[10px] font-black text-purple-2">Ask ›</span>
      </button>
      <div className="fixed left-0 right-0 bottom-[calc(96px+env(safe-area-inset-bottom))] sm:absolute sm:bottom-[96px] px-[18px] pointer-events-none">
        <div className="max-w-[402px] mx-auto flex gap-2 pointer-events-auto">
          <button aria-label="Save" className="w-11 h-11 rounded-[13px] bg-card border border-line flex items-center justify-center">🔖</button>
          <Link href="/club?tab=performance" aria-label="Your club" className="w-11 h-11 rounded-[13px] bg-card border border-line flex items-center justify-center">👥</Link>
          <button onClick={() => openSheet("pick", { symbol: p.symbol })} className="flex-1 bg-green-2 text-cream-text rounded-[13px] py-[13px] text-[13px] font-black shadow-[0_3px_0_#3A6B3E]">▲ Make a Pick</button>
        </div>
      </div>
    </div>
  );
}
