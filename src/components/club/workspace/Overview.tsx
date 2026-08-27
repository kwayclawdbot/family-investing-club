"use client";
import Link from "next/link";
import { useState } from "react";
import type { ClubOverview, VerifiedExposure } from "@/lib/types";
import { cx } from "@/components/ui";
import { VerifiedExposureView } from "@/components/verify/VerifiedExposure";
import { PerfChart, MarkerLegend } from "./PerfChart";
import { Belt, MemberDot, MiniSpark, Panel, Ring, SectionLabel, Ticker, pctText } from "./shared";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** Artboard 01 — Overview: performance hero → metric strip → top investors → active decision → research → what happened. */
export function Overview({ o, exposure }: { o: ClubOverview; exposure: VerifiedExposure }) {
  const [range, setRange] = useState("YTD");
  const [view, setView] = useState<"model" | "verified">("model");
  const [board, setBoard] = useState("Picks");
  const series = o.series.find((s) => s.range === range) ?? o.series[0];
  const d = o.activeDecision;

  return (
    <>
      {/* ── hero ── */}
      <div className="mt-[11px]">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-[28px] font-black text-ink">{money(o.value)}</span>
            <span className="ml-[7px] text-[12.5px] font-black text-[#3A8C4A]">{pctText(o.ytdPct)} {range === "YTD" ? "YTD" : range}</span>
          </div>
          <span className="text-[10px] font-extrabold text-ink-3">vs S&amp;P 500 <b className="text-orange-2">{pctText(o.benchmarkPct)}</b></span>
        </div>
        {view === "model" ? (
          <>
            <PerfChart club={series.club} benchmark={series.benchmark} markers={series.markers} />
            <div className="flex justify-between items-center mt-[2px]">
              <div className="flex gap-1" role="tablist" aria-label="Range">
                {o.ranges.map((r) => (
                  <button key={r} role="tab" aria-selected={r === range} onClick={() => setRange(r)} className={cx("text-[10px] rounded-[8px]", r === range ? "bg-ink text-cream-text px-[9px] py-[3px] font-black" : "text-ink-4 px-[6px] py-[3px] font-extrabold")}>{r}</button>
                ))}
              </div>
              <MarkerLegend markers={series.markers} />
            </div>
          </>
        ) : (
          <div className="-mt-1"><VerifiedExposureView e={exposure} /></div>
        )}
        <div className="mt-[7px] flex bg-[#EFE7D6] rounded-[10px] p-[3px] w-[230px]" role="tablist" aria-label="Portfolio view">
          {(["model", "verified"] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={cx("flex-1 rounded-[8px] py-[5px] text-[10px] font-black", view === v ? "bg-[#FFFDF7] text-ink" : "text-ink-3")}>{v === "model" ? "CLUB MODEL" : "VERIFIED ✓"}</button>
          ))}
        </div>
      </div>

      {/* ── metric strip ── */}
      <div className="flex gap-[7px] mt-[10px]">
        <div className="flex-1 bg-card border border-line rounded-[12px] px-[10px] py-2">
          <div className="text-[8.5px] font-black text-ink-3">BEST PICK</div>
          <div className="flex items-center gap-1 mt-[2px]"><span className="text-[12px] font-black text-ink">{o.metrics.bestPick.symbol}</span><MiniSpark width={30} height={13} /></div>
          <div className="text-[10px] font-black text-[#3A8C4A]">{pctText(o.metrics.bestPick.pct)} · {o.metrics.bestPick.by}</div>
        </div>
        <div className="flex-1 bg-card border border-line rounded-[12px] px-[10px] py-2">
          <div className="text-[8.5px] font-black text-ink-3">WIN RATE</div>
          <div className="flex items-center gap-[6px] mt-[3px]">
            <Ring pct={o.metrics.winRatePct} />
            <div><div className="text-[12px] font-black text-ink">{o.metrics.winRatePct}%</div><div className="text-[8px] font-extrabold text-ink-3">{o.metrics.resolved} resolved</div></div>
          </div>
        </div>
        <div className="flex-1 bg-card border border-line rounded-[12px] px-[10px] py-2">
          <div className="text-[8.5px] font-black text-ink-3">VERIFIED</div>
          <div className="text-[13px] font-black text-ink mt-[3px]">{o.metrics.verified.connected} of {o.metrics.verified.adults}</div>
          <div className="text-[8.5px] font-extrabold text-ink-3">adults · {o.metrics.verified.syncedAgo}</div>
        </div>
      </div>

      {/* ── top club investors ── */}
      <SectionLabel>TOP CLUB INVESTORS · {board.toUpperCase()}, YTD</SectionLabel>
      <Panel>
        {o.topInvestors.map((t, i) => (
          <div key={t.memberId} className={cx("flex items-center gap-[9px] py-2", i < o.topInvestors.length - 1 && "border-b border-paper-2")}>
            <span className="w-4 text-[11px] font-black text-ink-3">{t.rank}</span>
            <MemberDot memberId={t.memberId} />
            <span className="flex-1 flex items-center gap-[6px] flex-wrap text-[12.5px] font-extrabold text-ink"><span>{t.name}</span><Belt memberId={t.memberId} /></span>
            <span className="text-[9px] font-extrabold text-ink-4">{t.picks} picks{t.verified ? " ✓" : ""}</span>
            <span className="text-[12.5px] font-black text-[#3A8C4A]">{pctText(t.ytdPct)}</span>
          </div>
        ))}
      </Panel>
      <div className="flex gap-[5px] mt-[6px] items-center">
        {o.boards.map((b) => (
          <button key={b} onClick={() => setBoard(b)} className={cx("rounded-[12px] px-[11px] py-1 text-[9.5px]", b === board ? "bg-ink text-cream-text font-black" : "bg-card border border-line text-ink-3 font-extrabold")}>{b}</button>
        ))}
        <Link href={board === "XP" ? "/club/xp" : `/club/leaderboards?board=${board.toLowerCase()}`} className="ml-auto text-[9.5px] font-extrabold text-green py-1">Full board ›</Link>
      </div>
      {board !== "Picks" && <div className="mt-1 text-[9.5px] font-bold text-ink-4">Showing the Picks ranking — the {board} board opens in full view.</div>}

      {/* ── active decision ── */}
      {d && (
        <>
          <SectionLabel>ACTIVE DECISION</SectionLabel>
          <div className="bg-purple-tint border border-[#DDD4F0] rounded-[14px] px-[13px] py-[11px] flex items-center gap-[11px]">
            <Ring pct={(d.voted / d.eligible) * 100} size={44} stroke={4} color="#8B7BC7" track="#E3D9F5"><span className="text-[10px] font-black text-ink">{d.voted}/{d.eligible}</span></Ring>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-black text-ink">{d.title}</div>
              <div className="text-[10px] font-extrabold text-ink-3">{d.by} proposed · {d.hoursLeft}h left{d.waitingOn ? ` · waiting on ${d.waitingOn}` : ""}</div>
            </div>
            <Link href={`/club/vote/${d.proposalId}`} className="bg-purple text-cream-text rounded-[11px] px-[14px] py-2 text-[11.5px] font-black">Vote</Link>
          </div>
        </>
      )}

      {/* ── research in progress ── */}
      <SectionLabel right={<Link href="/club/research" className="text-[9.5px] font-extrabold text-green">All research ›</Link>}>RESEARCH IN PROGRESS</SectionLabel>
      <Panel className="px-[13px]">
        {o.research.map((r, i) => (
          <div key={r.symbol + r.assigneeId} className={cx("flex items-center gap-[10px] py-2", i < o.research.length - 1 && "border-b border-paper-2")}>
            <Ticker symbol={r.symbol} tone={r.status === "ready" ? "gold" : "paper"} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-extrabold text-ink">{r.name} · {r.assignee}{r.gated ? " 🎓" : ""}</div>
              {r.status === "ready" ? (
                <div className="text-[10px] font-bold text-ink-3">&ldquo;{r.note}&rdquo; · ready</div>
              ) : (
                <div className="h-1 rounded-[2px] bg-line-2 mt-1 w-[120px] overflow-hidden"><div className="h-full rounded-[2px] bg-orange" style={{ width: "60%" }} /></div>
              )}
            </div>
            {r.status === "ready" ? (
              <Link href={`/club/pick/new?symbol=${r.symbol}`} className="bg-green-tint text-green rounded-[8px] px-[9px] py-1 text-[9px] font-black">→ Pick</Link>
            ) : (
              <span className="text-[9px] font-extrabold text-orange-2">{r.due}{r.comments ? ` · 💬 ${r.comments}` : ""}</span>
            )}
          </div>
        ))}
      </Panel>

      {/* ── what happened ── */}
      <SectionLabel>WHAT HAPPENED</SectionLabel>
      <div className="pb-4">
        {o.happened.map((h, i) => (
          <div key={h.id} className={cx("flex items-center gap-2 py-[6px]", i < o.happened.length - 1 && "border-b border-[#F1E8D4]")}>
            <MemberDot memberId={h.actorId} size={24} />
            <span className="flex-1 text-[11.5px] font-bold text-ink-2"><b className="text-ink">{h.actor}</b> {h.text}</span>
            {h.pct != null ? (<><MiniSpark /><span className="text-[9.5px] font-black text-[#3A8C4A]">{pctText(h.pct)}</span></>) : (<span className="text-[9px] font-extrabold text-ink-4">{h.ago}</span>)}
          </div>
        ))}
      </div>
    </>
  );
}
