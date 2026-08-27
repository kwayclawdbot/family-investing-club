import Link from "next/link";
import type { DiscoverSignals as Signals } from "@/lib/types";

/** Discover v2 — "People Like Me" signals (canvas v7, artboard 03). Never advice, always attributed. */
const KNOWN = new Set(["AAPL", "VOO", "KO", "NVDA", "COST", "DIS", "CEG", "VST", "CCJ", "SMR", "AMZN"]);
export const symbolHref = (s: string) => (KNOWN.has(s) ? `/discover/${s}` : `/search?q=${encodeURIComponent(s)}`);
const tileTone: Record<string, string> = {
  COST: "bg-[#FFFDF4] text-[#BC9227]", DIS: "bg-purple-tint text-purple-2", VOO: "bg-orange-tint text-orange-2",
  NVDA: "bg-green-tint text-green", CEG: "bg-green-tint text-green",
};

function SignalRow({ symbol, name, line, last }: { symbol: string; name: string; line: string; last?: boolean }) {
  return (
    <Link href={symbolHref(symbol)} className={`flex items-center gap-[10px] py-[9px] ${last ? "" : "border-b border-paper-2"}`}>
      <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-[9.5px] font-black ${tileTone[symbol] ?? "bg-line-2 text-ink-2"}`}>{symbol}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[12.5px] font-extrabold text-ink">{name}</span>
        <span className="block text-[10px] font-bold text-ink-3">{line}</span>
      </span>
      <span className="font-black text-ink-4" aria-hidden>›</span>
    </Link>
  );
}

export function DiscoverSignals({ s }: { s: Signals }) {
  return (
    <>
      <section className="mt-3 rounded-card border border-line bg-card px-[15px] py-3">
        <h2 className="text-[11px] font-black text-orange">👨‍👩‍👧‍👦 POPULAR WITH FAMILIES LIKE YOURS</h2>
        {s.familiesLikeYours.map((r, i) => <SignalRow key={r.symbol} {...r} last={i === s.familiesLikeYours.length - 1} />)}
      </section>
      <section className="mt-[10px] rounded-card border border-line bg-card px-[15px] py-3">
        <h2 className="text-[11px] font-black text-green">🔍 MOST RESEARCHED BY BEGINNER CLUBS</h2>
        {s.mostResearched.map((r, i) => <SignalRow key={r.symbol} {...r} last={i === s.mostResearched.length - 1} />)}
      </section>
      <div className="mt-[10px] flex gap-[9px]">
        <div className="flex-1 rounded-[14px] border border-line bg-card px-[13px] py-[11px]">
          <div className="text-[10px] font-black text-purple-2">✓ MOST OWNED · VERIFIED</div>
          <div className="mt-1 text-[12px] font-extrabold text-ink">{s.mostOwnedVerified.map((x, i) => <Link key={x} href={symbolHref(x)}>{x}{i < s.mostOwnedVerified.length - 1 ? " · " : ""}</Link>)}</div>
          <div className="mt-[2px] text-[9.5px] font-bold text-ink-4">by consenting members</div>
        </div>
        <div className="flex-1 rounded-[14px] border border-line bg-card px-[13px] py-[11px]">
          <div className="text-[10px] font-black text-orange-2">💬 MOST DISCUSSED IN CLUBS</div>
          <div className="mt-1 text-[12px] font-extrabold text-ink">{s.mostDiscussed.map((x, i) => <Link key={x} href={symbolHref(x)}>{x}{i < s.mostDiscussed.length - 1 ? " · " : ""}</Link>)}</div>
          <div className="mt-[2px] text-[9.5px] font-bold text-ink-4">this week</div>
        </div>
      </div>
      <Link href={s.trendingParents.href} className="mt-[10px] flex items-center gap-[10px] rounded-[14px] border border-[#DDD4F0] bg-purple-tint px-[14px] py-[11px]">
        <span className="text-[16px]" aria-hidden>📈</span>
        <span className="flex-1 text-[11.5px] font-extrabold text-[#584A93]">{s.trendingParents.text}</span>
        <span className="text-[11px] font-black text-purple-2" aria-hidden>›</span>
      </Link>
      <p className="mt-[9px] text-center text-[10px] font-bold text-ink-4">Signals come from picks, research &amp; verified holdings across FIC — never advice, always attributed</p>
    </>
  );
}
