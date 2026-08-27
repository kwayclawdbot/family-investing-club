"use client";
import Link from "next/link";
import { useState } from "react";
import type { ClubPortfolio, ClubProposal } from "@/lib/types";
import { cx } from "@/components/ui";
import { proposalTitle, tally } from "./MyClub";
import { ProposalStrip, ScreenHeader, TickerTile } from "./club-shared";
import { useStored } from "./storage";

/** Artboard 09 — the club's own practice portfolio: holdings link to proposals, decision journal. */
export function ClubPortfolioView({ portfolio, proposals }: { portfolio: ClubPortfolio; proposals: ClubProposal[] }) {
  const [all, setAll] = useState(false);
  const [local] = useStored<ClubProposal[]>("fic.proposals", []);
  const open = [...local, ...proposals].filter((p) => p.status === "open");
  const rows = all ? portfolio.holdings : portfolio.holdings.slice(0, 3);
  const behind = +(portfolio.ytdPct - portfolio.benchmarkYtdPct).toFixed(1);
  return (
    <div className="pb-6">
      <ScreenHeader backHref="/club" center title={<span className="bg-green-tint text-green rounded-[20px] px-[13px] py-[5px] text-[11px] font-black">PRACTICE · SIMULATED</span>} />
      <h1 className="mt-3 text-[20px] font-black text-ink">{portfolio.name}</h1>
      <div className="text-[11.5px] font-bold text-ink-3">No pooled money — decisions are real, dollars are practice</div>
      <div className="flex gap-[9px] mt-[11px]">
        <div className="flex-1 bg-card border border-line rounded-[14px] px-[13px] py-[11px]">
          <div className="text-[10px] font-extrabold text-ink-3">VALUE · YTD</div>
          <div className="text-[18px] font-black text-ink">${Math.round(portfolio.value).toLocaleString()} <span className="text-[12px] text-green-2">+{portfolio.ytdPct}%</span></div>
        </div>
        <div className="flex-1 bg-card border border-line rounded-[14px] px-[13px] py-[11px]">
          <div className="text-[10px] font-extrabold text-ink-3">VS. S&amp;P 500</div>
          <div className="text-[18px] font-black text-ink">+{portfolio.benchmarkYtdPct}% <span className={cx("text-[11px] font-extrabold", behind < 0 ? "text-red" : "text-green-2")}>{behind < 0 ? `−${Math.abs(behind)} behind` : `+${behind} ahead`}</span></div>
        </div>
      </div>

      <div className="mt-[10px] bg-card border border-line rounded-[16px] px-[15px] py-[11px]">
        <div className="flex justify-between">
          <span className="text-[12.5px] font-black text-ink">Holdings · {portfolio.holdings.length}</span>
          <span className="text-[10.5px] font-extrabold text-ink-3">each links to its proposal</span>
        </div>
        {rows.map((h, i) => {
          const href = h.proposalId ? `/club/vote/${h.proposalId}` : `/discover/${h.symbol}`;
          return (
            <Link key={h.symbol} href={href} className={cx("flex items-center gap-[10px] py-[9px]", i < rows.length - 1 && "border-b border-paper-2")}>
              <TickerTile symbol={h.symbol} />
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-extrabold text-ink">{h.name} · {h.weightPct}%</div>
                <div className="text-[10px] font-bold text-purple-2 truncate">{h.origin} →</div>
              </div>
              <span className={cx("text-[11.5px] font-black", h.returnPct >= 0 ? "text-green-2" : "text-red")}>{h.returnPct >= 0 ? "+" : ""}{h.returnPct}%</span>
            </Link>
          );
        })}
        {portfolio.holdings.length > 3 && (
          <button onClick={() => setAll((v) => !v)} className="w-full pt-[7px] text-center text-[11px] font-extrabold text-green">{all ? "Show fewer ▴" : `Show all ${portfolio.holdings.length} ▾`}</button>
        )}
      </div>

      <div className="mt-[10px] bg-card border border-line rounded-[16px] px-[15px] py-3">
        <div className="text-[11px] font-black text-orange">DECISION JOURNAL</div>
        {portfolio.journal.map((j, i) => (
          <div key={i} className={cx("text-[12px] font-bold text-[#4A4436] leading-[1.55]", i === 0 ? "mt-[7px]" : "mt-2 pt-2 border-t border-paper-2")}>
            <b className="font-black">{j.date} — {j.title}</b>{" "}
            {j.believed && <>We believed: {j.believed} </>}
            {j.wrongIf && <>We&apos;ll be wrong if: {j.wrongIf} </>}
            {j.review && <>Review: {j.review}</>}
            {j.learned && <>Learned: {j.learned}</>}
          </div>
        ))}
      </div>

      {open.map((p) => <ProposalStrip key={p.id} text={`Open: ${proposalTitle(p)} more · ${tally(p)} voted`} href={`/club/vote/${p.id}`} />)}
      <div className="mt-3 flex gap-2">
        <Link href="/club/propose" className="flex-1 bg-card border-[1.5px] border-[#DDD4F0] text-purple-2 rounded-[12px] py-[10px] text-center text-[12px] font-black">Propose a change</Link>
        <Link href="/club/portfolio/fic-growth" className="flex-1 bg-card border-[1.5px] border-line text-ink-2 rounded-[12px] py-[10px] text-center text-[12px] font-black">Public model portfolios</Link>
      </div>
    </div>
  );
}
