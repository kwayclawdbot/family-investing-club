"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clubApi, signedOut } from "@/lib/live/client-club";
import { SheetFrame } from "./SheetFrame";
import { showXp } from "./bus";
import { cx } from "@/components/ui";

type Stance = "buy" | "watch" | "pass";
const Lbl = ({ c }: { c: string }) => <div className="mt-[14px] text-[9.5px] font-black tracking-[0.5px] text-ink-3">{c}</div>;
const NAMES: Record<string, string> = { NVDA: "Nvidia", AAPL: "Apple", COST: "Costco", CEG: "Constellation Energy", VOO: "S&P 500 ETF", KO: "Coca-Cola", AMZN: "Amazon", DIS: "Disney" };

/** Prototype v2 `pick`: "$1,204.10 · NVDA · Your Pick on Nvidia · timestamped · tracked from today".
 *  Live price; POST /api/club/pick when signed in. Only a 401 (signed out) falls back to localStorage — every other refusal is shown. */
export function PickSheet({ onClose, symbol = "NVDA" }: { onClose: () => void; symbol?: string }) {
  const sym = symbol.toUpperCase();
  const router = useRouter();
  const [price, setPrice] = useState<{ price: number; changePct: number } | null>(null);
  const [stance, setStance] = useState<Stance>("buy");
  const [why, setWhy] = useState("");
  const [horizon, setHorizon] = useState<"1y" | "3y" | "5y+">("3y");
  const [conf, setConf] = useState(3);
  const [to, setTo] = useState<"club" | "public">("club");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch(`/api/market/quote?symbols=${sym}`).then((r) => r.json()).then((j) => { const q = j?.quotes?.[sym]; if (q) setPrice({ price: q.price, changePct: q.changePct }); }).catch(() => {});
  }, [sym]);
  async function share() {
    if (why.trim().length < 3 || busy) return;
    setBusy(true); setError(null);
    const body = { symbol: sym, companyName: NAMES[sym] ?? sym, stance, reason: why.trim(), horizon, confidence: conf, visibility: to };
    const r = await clubApi.pick(body);
    setBusy(false);
    if (r.ok) { showXp(r.xp || 8); onClose(); router.refresh(); router.push(to === "club" ? "/home?feed=private" : "/home"); return; }
    if (signedOut(r)) {
      try { const k = "fic.picks"; const cur = JSON.parse(localStorage.getItem(k) ?? "[]"); cur.unshift({ id: `local-${Date.now()}`, ...body, priceAtPick: price?.price ?? null, at: new Date().toISOString() }); localStorage.setItem(k, JSON.stringify(cur)); } catch { /* ignore */ }
      showXp(8); onClose(); router.push(to === "club" ? "/home?feed=private" : "/home"); return;
    }
    setError(r.error);
  }
  return (
    <SheetFrame onClose={onClose} height="tall">
      <div className="flex items-start justify-between mt-2">
        <div>
          <div className="text-[22px] font-black text-ink leading-none">{price ? `$${price.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"} <span className="text-[13px] text-ink-3">{sym}</span></div>
          <div className="mt-1 text-[15px] font-black text-ink">Your Pick on {NAMES[sym] ?? sym}</div>
          <div className="text-[10.5px] font-extrabold text-ink-3">timestamped · tracked from today</div>
        </div>
        <button aria-label="Close" onClick={onClose} className="text-ink-4 text-[18px] font-black">✕</button>
      </div>
      <div className="mt-[14px] grid grid-cols-3 gap-2">
        {([["buy", "▲ Buy"], ["watch", "👁 Watch"], ["pass", "✕ Pass"]] as [Stance, string][]).map(([s, l]) => (
          <button key={s} onClick={() => setStance(s)} className={cx("h-11 rounded-[12px] text-[13px] font-black border", stance === s ? "bg-green-tint border-green-2 text-green" : "bg-card border-line text-ink-2")}>{l}</button>
        ))}
      </div>
      <Lbl c="ONE HONEST SENTENCE — WHY?" />
      <textarea value={why} onChange={(e) => setWhy(e.target.value.slice(0, 140))} placeholder="Their chips are in every AI data center being built" className="mt-[6px] w-full h-[74px] rounded-[12px] border border-line bg-card px-3 py-2 text-[13px] font-bold text-ink placeholder:text-ink-4 outline-none focus:border-green" />
      <div className="grid grid-cols-2 gap-3">
        <div><Lbl c="HORIZON" /><select value={horizon} onChange={(e) => setHorizon(e.target.value as "1y" | "3y" | "5y+")} className="mt-[6px] w-full h-10 rounded-[10px] border border-line bg-card px-3 text-[12.5px] font-extrabold text-ink"><option value="1y">1 year</option><option value="3y">3 years</option><option value="5y+">5+ years</option></select></div>
        <div><Lbl c="CONFIDENCE" /><div className="mt-[10px] flex gap-[6px]">{[1, 2, 3, 4, 5].map((n) => <button key={n} aria-label={`Confidence ${n}`} onClick={() => setConf(n)} className={cx("w-[18px] h-[18px] rounded-full border", n <= conf ? "bg-green-2 border-green-2" : "bg-card border-line-3")} />)}</div></div>
      </div>
      <Lbl c="SHARE TO" />
      <div className="mt-[6px] grid grid-cols-2 gap-2">
        {([["club", "🔒 My Club"], ["public", "🌍 Main Feed"]] as ["club" | "public", string][]).map(([v, l]) => (
          <button key={v} onClick={() => setTo(v)} className={cx("h-10 rounded-[10px] text-[12px] font-black border", to === v ? "bg-green-tint border-green-2 text-green" : "bg-card border-line text-ink-2")}>{l}</button>
        ))}
      </div>
      {error && <p role="alert" className="mt-3 rounded-[12px] bg-orange-tint border border-orange-line px-3 py-2 text-[12px] font-bold text-orange-2">{error}</p>}
      <div className="mt-auto pt-4 pb-2">
        <button disabled={busy || why.trim().length < 3} onClick={share} className="w-full h-[52px] rounded-[16px] bg-green text-cream-text text-[15px] font-black disabled:opacity-50">{busy ? "Sharing…" : `Share Pick with the ${to === "club" ? "Club" : "Feed"}`}</button>
      </div>
    </SheetFrame>
  );
}
