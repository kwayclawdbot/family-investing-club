"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Company, Order, Portfolio } from "@/lib/types";
import { Card, Button, Tag } from "@/components/ui";
import { Sheet } from "@/components/ui/extras";
import { CheckIcon } from "@/components/ui/icons";
import { SymbolTile } from "./SymbolTile";
import { money } from "./format";
import { addOrder, readOrders, readLevel, isYouth } from "./store";

const HORIZONS = ["1 year", "3 years", "5+ years"];
const YOUTH_THESIS = ["I use it", "I think it will grow"];

function heldShares(symbol: string, portfolio: Portfolio, orders: Order[]) {
  const base = portfolio.holdings.find((h) => h.symbol === symbol)?.shares ?? 0;
  return orders.filter((o) => o.symbol === symbol).reduce((n, o) => n + (o.side === "buy" ? o.shares : -o.shares), base);
}

export function TradeFlow({ company, portfolio, fixtureOrders }: { company: Company; portfolio: Portfolio; fixtureOrders: Order[] }) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [shares, setShares] = useState(1);
  const [thesis, setThesis] = useState("");
  const [horizon, setHorizon] = useState<string | null>(null);
  const [ack, setAck] = useState(false);
  const [review, setReview] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [local, setLocal] = useState<Order[]>([]);
  const [youth, setYouth] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setLocal(readOrders());
    setYouth(isYouth(readLevel()));
  }, []);

  const held = useMemo(() => heldShares(company.symbol, portfolio, [...fixtureOrders.filter((o) => !portfolio.holdings.some((h) => h.symbol === o.symbol)), ...local]), [company.symbol, portfolio, fixtureOrders, local]);
  const spentLocally = local.reduce((n, o) => n + (o.side === "buy" ? 1 : -1) * o.shares * o.price, 0);
  const buyingPower = Math.max(0, portfolio.cash - spentLocally);
  const total = shares * company.price;
  const maxBuy = Math.max(0, Math.floor(buyingPower / company.price));
  const max = side === "buy" ? maxBuy : held;
  const thesisOk = youth ? !!thesis : thesis.trim().length >= 8;
  const canReview = shares >= 1 && shares <= max && thesisOk && !!horizon && ack;

  function setQty(n: number) {
    setShares(Math.max(1, Math.min(Math.max(1, max), Math.floor(n) || 1)));
  }

  function place() {
    const o: Order = {
      id: `local-${Date.now()}`,
      symbol: company.symbol,
      side,
      shares,
      price: company.price,
      at: new Date().toISOString(),
      thesis: `${thesis.trim()} · ${horizon}`,
      status: "filled",
    };
    setLocal(addOrder(o));
    setReview(false);
    setPlaced(o);
  }

  if (placed) {
    return (
      <div className="pt-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-green-tint text-green flex items-center justify-center"><CheckIcon size={30} /></div>
        <div className="mt-3 text-[11px] font-extrabold text-orange-2 tracking-[0.3px]">+10 XP</div>
        <h2 className="mt-1 text-[22px] font-black text-ink">Order filled (virtual)</h2>
        <p className="mt-1 text-[13.5px] font-bold text-ink-3">
          {placed.side === "buy" ? "Bought" : "Sold"} {placed.shares} {placed.shares === 1 ? "share" : "shares"} of {company.symbol} at ${money(placed.price)}.
        </p>
        <Card className="mt-5 w-full text-left">
          <div className="text-[11px] font-extrabold text-green tracking-[0.3px] uppercase">Your thesis</div>
          <p className="mt-1 text-[13.5px] font-bold text-ink leading-[1.5]">{placed.thesis}</p>
          <p className="mt-2 text-[11.5px] font-bold text-ink-4">Kai will bring this back when you review the trade.</p>
        </Card>
        <Link href={`/club/pick/new?symbol=${company.symbol}&stance=${placed.side === "buy" ? "buy" : "pass"}`} className="mt-5 w-full h-[52px] rounded-[16px] bg-green-2 text-cream-text text-[16px] font-black flex items-center justify-center shadow-[0_3px_0_#3A6B3E]">▲ Share as a Pick with My Club</Link>
        <Link href="/practice" className="mt-3 w-full h-[52px] rounded-[16px] bg-orange text-cream-text text-[16px] font-black flex items-center justify-center shadow-[0_3px_0_#C96D25]">View portfolio</Link>
        <Link href={`/discover/${company.symbol}`} className="mt-3 text-[13px] font-extrabold text-green">Back to {company.symbol}</Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Tag tone="orange">PRACTICE ORDER · VIRTUAL MONEY</Tag>
      </div>
      <div className="mt-3 flex gap-[6px]" role="tablist">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={side === s}
            onClick={() => { setSide(s); setShares(1); }}
            className={`flex-1 h-[36px] rounded-[12px] text-[13px] font-black border ${
              side === s ? (s === "buy" ? "bg-green text-cream-text border-green" : "bg-red text-white border-red") : "bg-card border-line text-ink-3"
            }`}
          >
            {s === "buy" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>

      <Card className="mt-3 flex items-center gap-[11px]">
        <SymbolTile symbol={company.symbol} size={40} />
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-black text-ink truncate">{company.name}</span>
          <span className="block text-[11.5px] font-bold text-ink-4">{company.symbol} · you hold {held} {held === 1 ? "share" : "shares"}</span>
        </span>
        <span className="text-[16px] font-black text-ink">${money(company.price)}</span>
      </Card>

      <Card className="mt-3">
        <div className="flex items-center justify-between">
          <span className="text-[13.5px] font-black text-ink">Shares</span>
          <span className="text-[11.5px] font-bold text-ink-3">{side === "buy" ? `Buying power $${money(buyingPower)}` : `Max ${held}`}</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button type="button" aria-label="Fewer shares" onClick={() => setQty(shares - 1)} className="w-11 h-11 rounded-full bg-paper-2 text-[20px] font-black text-ink">−</button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={max || 1}
            value={shares}
            onChange={(e) => setQty(Number(e.target.value))}
            aria-label="Number of shares"
            className="flex-1 h-11 text-center text-[24px] font-black text-ink bg-transparent outline-none"
          />
          <button type="button" aria-label="More shares" onClick={() => setQty(shares + 1)} className="w-11 h-11 rounded-full bg-paper-2 text-[20px] font-black text-ink">+</button>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-paper-2 pt-3">
          <span className="text-[12.5px] font-bold text-ink-3">Estimated total</span>
          <span className="text-[16px] font-black text-ink">${money(total)}</span>
        </div>
        {max === 0 && (
          <p className="mt-2 text-[12px] font-bold text-red">{side === "buy" ? "Not enough virtual cash for one share." : `You don't hold any ${company.symbol} to sell.`}</p>
        )}
      </Card>

      <Card className="mt-3">
        <div className="text-[11px] font-extrabold text-green tracking-[0.3px] uppercase">{youth ? "Why this company?" : side === "buy" ? "Why are you buying?" : "Why are you selling?"}</div>
        {youth ? (
          <div className="mt-2 flex gap-[6px]">
            {YOUTH_THESIS.map((t) => (
              <button key={t} type="button" aria-pressed={thesis === t} onClick={() => setThesis(t)} className={`flex-1 h-[40px] rounded-[12px] text-[13px] font-extrabold border ${thesis === t ? "bg-green-tint border-green-2 text-green" : "bg-card border-line text-ink-2"}`}>{t}</button>
            ))}
          </div>
        ) : (
          <textarea
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            rows={3}
            placeholder="One or two sentences. If you can't say how the company makes money, pause here."
            className="mt-2 w-full rounded-[12px] border border-line bg-paper px-3 py-2 text-[13.5px] font-bold text-ink placeholder:text-ink-4 outline-none focus:border-green resize-none"
          />
        )}
        <div className="mt-3 text-[11px] font-extrabold text-ink-3 uppercase tracking-[0.3px]">{youth ? "How long will you keep it?" : "Time horizon"}</div>
        <div className="mt-2 flex gap-[6px]">
          {HORIZONS.map((h) => (
            <button key={h} type="button" aria-pressed={horizon === h} onClick={() => setHorizon(h)} className={`flex-1 h-[34px] rounded-[10px] text-[12px] font-extrabold border ${horizon === h ? "bg-green text-cream-text border-green" : "bg-card border-line text-ink-3"}`}>{h}</button>
          ))}
        </div>
        <label className="mt-3 flex items-start gap-[10px] cursor-pointer">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-[3px] w-[18px] h-[18px] accent-[#3A6B3E]" />
          <span className="text-[12.5px] font-bold text-ink-2 leading-[1.45]">{youth ? "I know this is practice money and prices go up and down." : "I understand this is practice and prices move."}</span>
        </label>
      </Card>

      <Button full disabled={!canReview} onClick={() => setReview(true)} className="mt-4 shadow-[0_3px_0_#C96D25] disabled:shadow-none">
        Review order
      </Button>
      <p className="mt-3 text-[11px] font-bold text-ink-4 text-center">No real money moves. Ever.</p>

      <Sheet open={review} onClose={() => setReview(false)} title="Review practice order">
        <div className="rounded-[14px] bg-paper-2 p-4">
          {[
            ["Action", `${side === "buy" ? "Buy" : "Sell"} ${shares} ${shares === 1 ? "share" : "shares"}`],
            ["Company", `${company.name} (${company.symbol})`],
            ["Price", `$${money(company.price)} · virtual`],
            ["Total", `$${money(total)}`],
            ["Horizon", horizon ?? "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-[6px] text-[13px]">
              <span className="font-bold text-ink-3">{k}</span>
              <span className="font-extrabold text-ink text-right">{v}</span>
            </div>
          ))}
          <div className="mt-2 border-t border-line pt-2 text-[12.5px] font-bold text-ink-2 leading-[1.45]"><b className="text-green">Thesis:</b> {thesis}</div>
        </div>
        <Button full onClick={place} className="mt-4 shadow-[0_3px_0_#C96D25]">Place practice order</Button>
        <button type="button" onClick={() => setReview(false)} className="mt-3 w-full text-[13px] font-extrabold text-ink-3">Edit</button>
      </Sheet>
    </>
  );
}
