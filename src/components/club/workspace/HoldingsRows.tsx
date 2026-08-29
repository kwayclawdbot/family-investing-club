"use client";
import Link from "next/link";
import { Logo } from "@/components/markets/Logo";
import { useEffect, useState } from "react";
import type { PortfolioTab } from "@/lib/types";
import { Panel } from "./shared";

type Q = { price: number; changePct: number };
/** HOLDINGS — live price ▲%, WEIGHT, SINCE ADD, and the real origin line (`fic_club_holdings.origin`). */
export function HoldingsRows({ holdings }: { holdings: PortfolioTab["holdings"] }) {
  const [q, setQ] = useState<Record<string, Q>>({});
  useEffect(() => {
    fetch(`/api/market/quote?symbols=${holdings.map((h) => h.symbol).join(",")}`).then((r) => r.json()).then((j) => setQ(j?.quotes ?? {})).catch(() => {});
  }, [holdings]);
  return (
    <Panel className="px-[13px] py-1">
      {holdings.map((h, i) => {
        const quote = q[h.symbol];
        const since = h.sinceAddPct;
        return (
          <Link key={h.symbol} href={`/discover/${h.symbol}`} className={`flex items-center gap-[10px] py-[9px] ${i < holdings.length - 1 ? "border-b border-paper-2" : ""}`}>
            <Logo symbol={h.symbol} size={36} radius={10} />
            <span className="flex-1 min-w-0">
              <span className="block text-[12.5px] font-black text-ink truncate">{h.name} <span className="text-[9.5px] font-extrabold text-ink-4">{h.symbol}</span></span>
              <span className="block text-[9.5px] font-extrabold text-ink-3 truncate">{h.origin || "club holding"}</span>
              <span className="block text-[10px] font-black text-ink mt-[2px]">{quote ? `$${quote.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"} <span className={quote && quote.changePct < 0 ? "text-red" : "text-[#3A8C4A]"}>{quote ? `${quote.changePct >= 0 ? "▲" : "▼"}${Math.abs(quote.changePct).toFixed(1)}%` : ""}</span></span>
            </span>
            <span className="text-right shrink-0">
              <span className="block text-[8.5px] font-black tracking-[0.4px] text-ink-4">WEIGHT</span>
              <span className="block text-[13px] font-black text-ink">{h.weightPct}%</span>
              <span className={`block text-[10px] font-black ${since !== null && since !== undefined && since < 0 ? "text-red" : "text-[#3A8C4A]"}`}>{since === null || since === undefined ? "—" : `${since >= 0 ? "+" : ""}${since.toFixed(1)}%`} <span className="text-[8px] text-ink-4 font-extrabold">SINCE ADD</span></span>
            </span>
          </Link>
        );
      })}
    </Panel>
  );
}
