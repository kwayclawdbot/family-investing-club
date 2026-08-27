"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Order, Portfolio, Company } from "@/lib/types";
import { Card } from "@/components/ui";
import { KaiSpark } from "@/components/ui/icons";
import { CompanyChart } from "./CompanyChart";
import { money, pct, tileTone } from "./format";
import { readOrders } from "./store";

const TABS = ["Holdings", "Orders", "History"] as const;

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function PracticePortfolio({ portfolio, orders = [], companies = [] }: { portfolio: Portfolio; orders?: Order[]; companies?: Company[] }) {
  const [info, setInfo] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Holdings");
  const [local, setLocal] = useState<Order[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setLocal(readOrders());
  }, []);
  const allOrders = useMemo(() => [...local, ...orders].sort((a, b) => b.at.localeCompare(a.at)), [local, orders]);
  // Holdings reflect local practice orders (fixture orders are already inside portfolio.holdings).
  const p = useMemo(() => {
    if (local.length === 0) return portfolio;
    const holdings = portfolio.holdings.map((h) => ({ ...h }));
    let cash = portfolio.cash;
    for (const o of [...local].reverse()) {
      const sign = o.side === "buy" ? 1 : -1;
      cash -= sign * o.shares * o.price;
      const h = holdings.find((x) => x.symbol === o.symbol);
      const c = companies.find((x) => x.symbol === o.symbol);
      const px = c?.price ?? o.price;
      if (h) {
        const perShare = h.shares ? h.value / h.shares : px;
        h.shares += sign * o.shares;
        h.value = +(h.shares * perShare).toFixed(2);
      } else if (sign > 0) {
        holdings.push({ symbol: o.symbol, name: c?.name ?? o.symbol, shares: o.shares, value: +(o.shares * px).toFixed(2), changePct: c?.changePct ?? 0 });
      }
    }
    const kept = holdings.filter((h) => h.shares > 0);
    const totalValue = +(cash + kept.reduce((n, h) => n + h.value, 0)).toFixed(2);
    return { ...portfolio, cash: +cash.toFixed(2), holdings: kept, totalValue };
  }, [portfolio, local, companies]);
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

      {tab === "Holdings" && (
        <Link href="/search" className="mt-[10px] flex h-[44px] items-center justify-center rounded-[14px] bg-green text-cream-text text-[13.5px] font-black shadow-[0_3px_0_#2E5631]">
          ＋ Place a practice order
        </Link>
      )}
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
        {tab === "Orders" &&
          (allOrders.length === 0 ? (
            <div className="py-7 text-center">
              <div className="text-[13.5px] font-extrabold text-ink">No orders yet</div>
              <div className="mt-1 text-[12px] font-bold text-ink-3">Open a company page and tap Practice buy to place your first virtual order.</div>
            </div>
          ) : (
            allOrders.map((o, i) => (
              <Link key={o.id} href={`/markets/${o.symbol}`} className={`flex items-center gap-[11px] py-[11px] ${i < allOrders.length - 1 ? "border-b border-paper-2" : ""}`}>
                <span className={`w-[34px] h-[34px] rounded-[11px] flex items-center justify-center text-[11px] font-black shrink-0 ${tileTone(o.symbol)}`}>{o.symbol}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-extrabold text-ink">
                    <span className={o.side === "buy" ? "text-green" : "text-red"}>{o.side === "buy" ? "Buy" : "Sell"}</span> {o.shares} @ ${money(o.price)}
                  </div>
                  {o.thesis && <div className="text-[11px] font-bold text-ink-3 truncate">{o.thesis}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-extrabold text-ink-3">{fmtDate(o.at)}</div>
                  <div className={`text-[10px] font-extrabold uppercase ${o.status === "filled" ? "text-green" : "text-orange-2"}`}>{o.status}</div>
                </div>
              </Link>
            ))
          ))}
        {tab === "History" &&
          (allOrders.length === 0 ? (
            <div className="py-7 text-center">
              <div className="text-[13.5px] font-extrabold text-ink">No trades yet</div>
              <div className="mt-1 text-[12px] font-bold text-ink-3">Your completed practice trades will show up here.</div>
            </div>
          ) : (
            <div className="py-2">
              {allOrders.map((o, i) => (
                <div key={o.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`w-3 h-3 rounded-full mt-[6px] ${o.side === "buy" ? "bg-green-2" : "bg-red"}`} />
                    {i < allOrders.length - 1 && <span className="flex-1 w-[2px] bg-line-2 my-1" />}
                  </div>
                  <div className={`flex-1 pb-4 ${i === allOrders.length - 1 ? "pb-2" : ""}`}>
                    <div className="text-[11px] font-extrabold text-ink-3">{fmtDate(o.at)}</div>
                    <div className="text-[13.5px] font-extrabold text-ink">
                      {o.side === "buy" ? "Bought" : "Sold"} {o.shares} {o.symbol} for ${money(o.shares * o.price)}
                    </div>
                    {o.thesis && <div className="text-[11.5px] font-bold text-ink-3 leading-[1.4]">“{o.thesis}”</div>}
                  </div>
                </div>
              ))}
            </div>
          ))}
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
