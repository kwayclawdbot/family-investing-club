"use client";
import Link from "next/link";
import { Logo } from "@/components/markets/Logo";
import { cx } from "@/components/ui";
import type { DecisionRecord, OfficialPicks as Picks } from "@/lib/live/club";
import { openSheet } from "@/components/sheets/bus";

const TONE: Record<string, string> = { BUY: "bg-green-tint text-green", CORE: "bg-paper-2 text-ink-2", WATCH: "bg-orange-tint text-orange-2" };
const pct = (n: number | null) => (n === null ? "—" : `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1)}%`);

/** OFFICIAL CLUB PICKS — the holdings the club actually voted in (`fic_club_holdings`), priced since add. */
export function OfficialPicks({ o }: { o: Picks | null }) {
  if (!o || !o.rows.length) {
    return (
      <div>
        <span className="text-[10px] font-black tracking-[0.5px] text-ink-3">OFFICIAL CLUB PICKS</span>
        <p className="mt-2 rounded-[14px] border border-line bg-card px-4 py-6 text-center text-[12px] font-bold text-ink-3">
          Nothing voted in yet. A pick becomes official when the club proposes it and the vote passes.
        </p>
      </div>
    );
  }
  const best = o.rows.filter((r) => r.pct !== null).sort((a, b) => b.pct! - a.pct!)[0];
  const tiles: [string, string, string][] = [
    [String(o.count), "HOLDINGS", "voted in"],
    [best ? pct(best.pct) : "—", "BEST", best ? best.symbol : "not priced"],
    [String(o.decided), "DECISIONS", "in the journal"],
  ];
  return (
    <div>
      <div className="flex items-baseline justify-between"><span className="text-[10px] font-black tracking-[0.5px] text-ink-3">OFFICIAL CLUB PICKS · YTD</span><span className="text-[10px] font-extrabold text-ink-4">{o.count} {o.count === 1 ? "holding" : "holdings"} · {o.open} open {o.open === 1 ? "vote" : "votes"}</span></div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={cx("text-[30px] font-black", (o.ytdPct ?? 0) >= 0 ? "text-green-2" : "text-red")}>{pct(o.ytdPct)}</span>
        <span className="text-[11px] font-extrabold text-ink-3">{o.benchPct === null ? "benchmark unavailable" : `vs S&P ${pct(o.benchPct)}`}{o.priced < o.count ? ` · ${o.priced} of ${o.count} priced` : ""}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">{tiles.map(([v, l, s]) => <div key={l} className="rounded-[12px] border border-line bg-card px-2 py-[9px] text-center"><div className="text-[16px] font-black text-ink">{v}</div><div className="text-[8.5px] font-black tracking-[0.4px] text-ink-4">{l}</div><div className="text-[9px] font-bold text-ink-3">{s}</div></div>)}</div>
      <div className="mt-[13px] mb-[6px] flex items-baseline justify-between"><span className="text-[10px] font-black tracking-[0.5px] text-ink-3">HOLDINGS</span><span className="text-[9.5px] font-extrabold text-ink-4">voted in by the club</span></div>
      <div className="rounded-[14px] border border-line bg-card px-3">
        {o.rows.map((r, i) => (
          <Link key={r.symbol} href={`/discover/${r.symbol}`} className={cx("flex items-center gap-[10px] py-[9px]", i < o.rows.length - 1 && "border-b border-paper-2")}>
            <Logo symbol={r.symbol} size={36} radius={9} />
            <span className="flex-1 min-w-0"><span className="flex items-center gap-[6px]"><span className="text-[13px] font-black text-ink">{r.name}</span><span className={cx("rounded-[5px] px-[5px] py-[1px] text-[8.5px] font-black", TONE[r.stance])}>{r.stance}</span></span><span className="block text-[10px] font-bold text-ink-3 truncate">{r.line}</span></span>
            <span className={cx("text-[13px] font-black", (r.pct ?? 0) >= 0 ? "text-green-2" : "text-red")}>{pct(r.pct)}</span>
          </Link>
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] font-bold text-ink-4">Return since the club added each holding · a ${o.stake.toLocaleString()} practice stake, not real money</p>
    </div>
  );
}

/** MY DECISION RECORD — one row per vote this member cast, with how it aged. */
export function DecisionRecordRows({ record }: { record: DecisionRecord | null }) {
  if (!record?.rows.length) return <p className="mt-2 py-4 text-center text-[11.5px] font-bold text-ink-3">No votes cast yet — your record starts with your first one.</p>;
  return (
    <div className="mt-2">
      {record.rows.map((r, i) => (
        <div key={`${r.symbol}-${r.date}-${i}`} className={cx("flex items-center gap-[9px] py-[8px]", i < record.rows.length - 1 && "border-b border-paper-2")}>
          <Logo symbol={r.symbol} size={32} radius={8} />
          <span className="flex-1 min-w-0 text-[11px] font-bold text-ink-2"><span className="block"><span className="text-ink">You voted </span><b className="text-green">{r.vote}</b> · {r.what} <span className="text-ink-4">· {r.date}</span></span><span className="block text-[10px] text-ink-3">{r.result}</span></span>
          <span className="text-right"><span className={cx("block text-[12px] font-black", r.pct.startsWith("−") ? "text-red" : "text-green-2")}>{r.pct}</span><span className="block text-[9px] font-extrabold text-ink-4">{r.verdict}</span></span>
        </div>
      ))}
      <p className="mt-2 text-center text-[9.5px] font-bold text-ink-4">&ldquo;Aged well&rdquo; = the holding moved the way you voted · learning metric, not a score</p>
    </div>
  );
}

/** Kai's line above the club composer — counted from the club's own rows, then a real Kai thread. */
export function KaiSummaryRow({ summary }: { summary?: string }) {
  return (
    <div className="my-2 flex items-start gap-[9px]">
      <span className="w-[26px] h-[26px] rounded-full bg-purple-2 text-cream-text text-[11px] font-black flex items-center justify-center shrink-0">K</span>
      <div className="flex-1 rounded-[12px] border border-purple-line bg-purple-tint px-3 py-[9px]">
        <div className="text-[10px] font-black text-purple-2">Kai ✦ · summary</div>
        <div className="text-[12px] font-bold text-ink-2">{summary ?? "Ask me about anything your club is holding, deciding or researching."} <button type="button" onClick={() => openSheet("kai")} className="text-purple-2 font-black">Ask me anything →</button></div>
      </div>
    </div>
  );
}
