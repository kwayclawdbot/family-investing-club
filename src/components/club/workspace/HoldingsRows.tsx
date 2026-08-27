"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { PortfolioTab } from "@/lib/types";
import { holdingsMeta } from "@/lib/fixtures/v13-club";
import { Panel } from "./shared";

type Q = { price: number; changePct: number };
/** Prototype v2 `clubperf`: HOLDINGS · 6 — live price ▲%, WEIGHT, SINCE ADD, origin line → company page. */
export function HoldingsRows({ holdings }: { holdings: PortfolioTab["holdings"] }) {
  const [q, setQ] = useState<Record<string, Q>>({});
  useEffect(() => {
    fetch(`/api/market/quote?symbols=${holdings.map((h) => h.symbol).join(",")}`).then((r) => r.json()).then((j) => setQ(j?.quotes ?? {})).catch(() => {});
  }, [holdings]);
  return (
    <Panel className="px-[13px] py-1">
      {holdings.map((h, i) => {
        const m = holdingsMeta[h.symbol]; const quote = q[h.symbol];
        return (
          <Link key={h.symbol} href={`/discover/${h.symbol}`} className={`flex items-center gap-[10px] py-[9px] ${i < holdings.length - 1 ? "border-b border-paper-2" : ""}`}>
            <span className="w-9 h-9 rounded-[10px] bg-green-tint text-green text-[9px] font-black flex items-center justify-center shrink-0">{h.symbol}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-[12.5px] font-black text-ink truncate">{h.name} <span className="text-[9.5px] font-extrabold text-ink-4">{h.symbol}</span></span>
              <span className="block text-[9.5px] font-extrabold text-ink-3 truncate">{m?.origin ?? "club holding"}</span>
              <span className="block text-[10px] font-black text-ink mt-[2px]">{quote ? `$${quote.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"} <span className={quote && quote.changePct < 0 ? "text-red" : "text-[#3A8C4A]"}>{quote ? `${quote.changePct >= 0 ? "▲" : "▼"}${Math.abs(quote.changePct).toFixed(1)}%` : ""}</span></span>
            </span>
            <span className="text-right shrink-0">
              <span className="block text-[8.5px] font-black tracking-[0.4px] text-ink-4">WEIGHT</span>
              <span className="block text-[13px] font-black text-ink">{h.weightPct}%</span>
              <span className="block text-[10px] font-black text-[#3A8C4A]">{m?.sinceAdd ?? `${h.returnPct >= 0 ? "+" : ""}${h.returnPct}%`} <span className="text-[8px] text-ink-4 font-extrabold">SINCE ADD</span></span>
            </span>
          </Link>
        );
      })}
    </Panel>
  );
}
