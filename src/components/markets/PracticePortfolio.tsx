"use client";
import Link from "next/link";
import { useState } from "react";
import type { Portfolio } from "@/lib/types";
import { Card } from "@/components/ui";
import { KaiSpark } from "@/components/ui/icons";
import { CompanyChart } from "./CompanyChart";
import { money, pct, tileTone } from "./format";

const TABS = ["Holdings", "Orders", "History"] as const;

export function PracticePortfolio({ portfolio }: { portfolio: Portfolio }) {
  const [info, setInfo] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Holdings");
  const p = portfolio;
  // Same curve for every range for now — the data seam only carries one series.
  const series = Object.fromEntries(["1D", "1W", "1M", "3M", "1Y", "ALL"].map((k) => [k, p.series]));

  return (
    <>
      <div className="flex items-center gap-[7px]">
        <h1 className="text-[21px] font-black text-ink">Practice Portfolio</h1>
        <button
          onClick={() => setInfo((v) => !v)}
          aria-expanded={info}
          aria-label="About practice money"
          className="w-[18px] h-[18px] rounded-full border-[1.8px] border-ink-4 text-ink-4 flex items-center justify-center text-[11px] font-extrabold leading-none"
        >
          i
        </button>
      </div>
      {info && (
        <p className="mt-2 text-[12px] font-bold text-ink-3 bg-paper-2 border border-line rounded-[10px] px-3 py-2">
          Virtual money — nothing here is real. Practice investing so mistakes are free.
        </p>
      )}

      <div className="flex gap-[10px] mt-3">
        <Card className="flex-1 !px-[14px] !py-3">
          <div className="text-[11.5px] font-extrabold text-ink-3">Virtual Cash</div>
          <div className="text-[19px] font-black text-ink mt-[2px]">${money(p.cash)}</div>
        </Card>
        <Card className="flex-1 !px-[14px] !py-3">
          <div className="text-[11.5px] font-extrabold text-ink-3">Total Value</div>
          <div className="text-[19px] font-black text-ink mt-[2px]">${money(p.totalValue)}</div>
          <div className={`text-[11.5px] font-extrabold ${p.dayChange >= 0 ? "text-[#3A8C4A]" : "text-red"}`}>
            {p.dayChange >= 0 ? "+" : "−"}${money(Math.abs(p.dayChange))} ({pct(p.dayChangePct, 2).slice(1)})
          </div>
        </Card>
      </div>

      <CompanyChart series={series} ranges={["1D", "1W", "1M", "3M", "1Y", "ALL"]} color="#E58234" height={96} fill={false} />

      <div className="flex gap-[7px] mt-[14px]" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`h-[32px] px-4 rounded-[10px] text-[12.5px] border ${
              tab === t ? "bg-orange-tint border-orange-line text-orange-2 font-black" : "bg-card border-line text-ink-3 font-extrabold"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Card className="mt-[10px] !py-1 !px-4">
        {tab === "Holdings" &&
          p.holdings.map((h, i) => (
            <Link
              key={h.symbol}
              href={`/markets/${h.symbol}`}
              className={`flex items-center gap-[11px] py-[11px] ${i < p.holdings.length - 1 ? "border-b border-paper-2" : ""}`}
            >
              <span className={`w-[34px] h-[34px] rounded-[11px] flex items-center justify-center text-[11px] font-black shrink-0 ${tileTone(h.symbol)}`}>
                {h.symbol}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-extrabold text-ink truncate">{h.name}</div>
                <div className="text-[11px] font-bold text-ink-4">{h.shares} {h.shares === 1 ? "share" : "shares"}</div>
              </div>
              <div className="text-right">
                <div className="text-[13.5px] font-black text-ink">${money(h.value)}</div>
                <div className={`text-[11px] font-extrabold ${h.changePct >= 0 ? "text-[#3A8C4A]" : "text-red"}`}>{pct(h.changePct)}</div>
              </div>
            </Link>
          ))}
        {tab === "Orders" && (
          <div className="py-7 text-center">
            <div className="text-[13.5px] font-extrabold text-ink">No orders yet</div>
            <div className="mt-1 text-[12px] font-bold text-ink-3">Open a company page and tap Practice to place your first virtual order.</div>
          </div>
        )}
        {tab === "History" && (
          <div className="py-7 text-center">
            <div className="text-[13.5px] font-extrabold text-ink">No trades yet</div>
            <div className="mt-1 text-[12px] font-bold text-ink-3">Your completed practice trades will show up here.</div>
          </div>
        )}
      </Card>

      <Link
        href={p.insight.lessonHref}
        className="mt-3 flex items-center gap-[10px] bg-purple-tint border border-[#DDD4F0] rounded-[14px] px-[14px] py-3"
      >
        <span className="w-7 h-7 rounded-[10px] bg-purple text-white flex items-center justify-center shrink-0">
          <KaiSpark size={14} />
        </span>
        <span className="text-[12px] font-bold text-[#584A93] leading-[1.4]">
          {p.insight.text} <b>Learn: {p.insight.lessonTitle}</b> — {p.insight.lessonMinutes} min lesson →
        </span>
      </Link>
    </>
  );
}
