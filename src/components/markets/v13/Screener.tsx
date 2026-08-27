"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Logo, Pct, Signed, BackBar } from "./bits";
import { screenerRows, type ScreenerRow } from "@/lib/fixtures/v13-discover";
import type { Quote } from "./DiscoverV13";

type Filters = { sector: string; peUnder40: boolean; buy60: boolean; clubsLikeMine: boolean; dividend: boolean; cap: "any" | "mega" | "large" };
const DEFAULT: Filters = { sector: "All sectors", peUnder40: true, buy60: true, clubsLikeMine: true, dividend: false, cap: "any" };
const SECTORS = ["All sectors", "Technology", "Consumer", "Energy", "ETF"];
type Sort = "fic" | "ytd" | "pe";

const chipOn = "bg-green-tint border border-[#A9C69E] text-green rounded-[15px] px-3 py-[5px] text-[10px] font-black whitespace-nowrap";
const chipOff = "bg-card border border-line text-ink-3 rounded-[15px] px-3 py-[5px] text-[10px] font-extrabold whitespace-nowrap";

/** Stock Screener — prototype v2 `screener`: filters as removable chips, quick screens, FIC-signal rows. */
export function Screener({ quotes }: { quotes: Record<string, Quote | undefined> }) {
  const [f, setF] = useState<Filters>(DEFAULT);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("fic");
  const [saved, setSaved] = useState(false);
  const [sectorOpen, setSectorOpen] = useState(false);
  const [capOpen, setCapOpen] = useState(false);
  useEffect(() => { try { const s = localStorage.getItem("fic.screens"); if (s) { const j = JSON.parse(s); if (j?.filters) { // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setF({ ...DEFAULT, ...j.filters }); } } } catch { /* ignore */ } }, []);

  const rows = useMemo(() => {
    let r: ScreenerRow[] = screenerRows.filter((x) => (f.sector === "All sectors" || x.sector === f.sector) && (!f.peUnder40 || (x.pe > 0 && x.pe < 40)) && (!f.buy60 || x.fic.buy >= 60) && (!f.clubsLikeMine || x.familyOwned) && (!f.dividend || x.dividend) && (f.cap === "any" || x.cap === f.cap));
    if (q.trim()) { const s = q.trim().toLowerCase(); r = r.filter((x) => x.symbol.toLowerCase().includes(s) || x.name.toLowerCase().includes(s)); }
    return [...r].sort((a, b) => sort === "fic" ? b.fic.buy - a.fic.buy : sort === "ytd" ? b.ytd - a.ytd : (a.pe || 999) - (b.pe || 999));
  }, [f, q, sort]);
  const active = [f.sector !== "All sectors", f.peUnder40, f.buy60, f.clubsLikeMine, f.dividend, f.cap !== "any"].filter(Boolean).length;
  const save = () => { try { localStorage.setItem("fic.screens", JSON.stringify({ filters: f, savedAt: Date.now(), symbols: rows.map((r) => r.symbol) })); } catch { /* ignore */ } setSaved(true); setTimeout(() => setSaved(false), 1600); };

  return (
    <div className="pt-[14px] pb-6">
      <BackBar title="Stock Screener" right={<button onClick={save} className="rounded-[10px] bg-green-2 text-cream-text px-3 py-[6px] text-[10px] font-black">{saved ? "Saved ✓" : "💾 Save watchlist"}</button>} />
      <label className="mt-[9px] flex items-center gap-[9px] bg-card border border-line rounded-[13px] px-[13px] py-[9px]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A89F8D" strokeWidth={2.5}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search within results…" className="flex-1 bg-transparent outline-none text-[12.5px] font-bold text-ink placeholder:text-ink-4" />
      </label>

      <div className="mt-[9px] bg-card border border-line rounded-[14px] px-[13px] py-[10px]">
        <div className="flex justify-between items-center"><span className="text-[9px] font-black text-ink-3">FILTERS · {active} ACTIVE</span><button onClick={() => setF({ ...DEFAULT, peUnder40: false, buy60: false, clubsLikeMine: false })} className="text-[9.5px] font-black text-orange-2">Reset</button></div>
        <div className="flex gap-[5px] mt-[7px] flex-wrap">
          <span className="relative">
            <button onClick={() => setSectorOpen((v) => !v)} className={f.sector !== "All sectors" ? chipOn : chipOff}>{f.sector} ▾</button>
            {sectorOpen && <span className="absolute z-20 top-8 left-0 bg-card border border-line rounded-[12px] p-1 shadow-lg flex flex-col min-w-[140px]">{SECTORS.map((s) => <button key={s} onClick={() => { setF({ ...f, sector: s }); setSectorOpen(false); }} className="text-left px-3 py-[6px] text-[11px] font-extrabold text-ink rounded-[8px] hover:bg-paper-2">{s}</button>)}</span>}
          </span>
          <button onClick={() => setF({ ...f, peUnder40: !f.peUnder40 })} className={f.peUnder40 ? chipOn : chipOff}>P/E &lt; 40 {f.peUnder40 ? "✕" : ""}</button>
          <button onClick={() => setF({ ...f, buy60: !f.buy60 })} className={f.buy60 ? chipOn : chipOff}>🟢 60%+ Buy {f.buy60 ? "✕" : ""}</button>
          <button onClick={() => setF({ ...f, clubsLikeMine: !f.clubsLikeMine })} className={f.clubsLikeMine ? chipOn : chipOff}>Owned by clubs like mine {f.clubsLikeMine ? "✕" : ""}</button>
          <button onClick={() => setF({ ...f, dividend: !f.dividend })} className={f.dividend ? chipOn : chipOff}>Dividend {f.dividend ? "✕" : ""}</button>
          <span className="relative">
            <button onClick={() => setCapOpen((v) => !v)} className={f.cap !== "any" ? chipOn : chipOff}>Mkt cap{f.cap !== "any" ? ` · ${f.cap}` : ""} ▾</button>
            {capOpen && <span className="absolute z-20 top-8 left-0 bg-card border border-line rounded-[12px] p-1 shadow-lg flex flex-col min-w-[120px]">{(["any", "mega", "large"] as const).map((c) => <button key={c} onClick={() => { setF({ ...f, cap: c }); setCapOpen(false); }} className="text-left px-3 py-[6px] text-[11px] font-extrabold text-ink rounded-[8px] hover:bg-paper-2">{c === "any" ? "Any size" : c === "mega" ? "Mega (>$200B)" : "Large ($10–200B)"}</button>)}</span>}
          </span>
          <span className={chipOff}>＋ More</span>
        </div>
        <div className="flex gap-2 mt-[9px] pt-[9px] border-t border-paper-2 items-center flex-wrap">
          <span className="text-[8.5px] font-black text-ink-4">QUICK SCREENS</span>
          <Link href="/theme/nuclear-energy" className="bg-orange-tint text-orange-2 rounded-[9px] px-[9px] py-[3px] text-[9px] font-black">⚡ Nuclear</Link>
          <button onClick={() => setF({ ...DEFAULT, sector: "All sectors", peUnder40: true, buy60: false, clubsLikeMine: true, dividend: false, cap: "mega" })} className="bg-purple-tint text-purple-2 rounded-[9px] px-[9px] py-[3px] text-[9px] font-black">👨‍👩‍👧 Family starters</button>
          <button onClick={() => setF({ ...DEFAULT, peUnder40: true, buy60: false, clubsLikeMine: false, dividend: true })} className="bg-green-tint text-green rounded-[9px] px-[9px] py-[3px] text-[9px] font-black">💰 Dividend</button>
        </div>
      </div>

      <div className="mt-[9px] flex items-center justify-between">
        <span className="text-[10.5px] font-black text-ink-3">{rows.length} MATCHES</span>
        <div className="flex gap-1">{(["fic", "ytd", "pe"] as Sort[]).map((s) => <button key={s} onClick={() => setSort(s)} className={sort === s ? "bg-ink text-cream-text rounded-[9px] px-[10px] py-1 text-[9px] font-black" : "bg-card border border-line text-ink-3 rounded-[9px] px-[10px] py-1 text-[9px] font-extrabold"}>{s === "fic" ? "FIC signal ▾" : s === "ytd" ? "YTD" : "P/E"}</button>)}</div>
      </div>

      <div className="mt-[6px] bg-card border border-line rounded-[15px] px-[14px] py-[3px]">
        {rows.length === 0 && <div className="py-6 text-center text-[11px] font-bold text-ink-3">No matches — loosen a filter.</div>}
        {rows.map((r, i) => {
          const q2 = quotes[r.symbol]; const price = q2?.price ?? r.fallbackPrice; const pct = q2?.changePct ?? r.fallbackPct;
          const peColor = r.pe === 0 ? "#A89F8D" : r.pe >= 50 ? "#C96A57" : r.pe >= 35 ? "#B07235" : "#3A6B3E";
          return (
            <Link key={r.symbol} href={`/discover/${r.symbol}`} className={`block py-[9px] ${i < rows.length - 1 ? "border-b border-paper-2" : ""}`}>
              <div className="flex items-center gap-[9px]">
                <Logo symbol={r.symbol} />
                <div className="flex-1 min-w-0"><div className="text-[12.5px] font-black text-ink">{r.name} <span className="text-[9px] font-extrabold text-ink-4">{r.symbol}</span></div><div className="text-[8.5px] font-bold text-ink-3 truncate">{r.line}</div></div>
                <div className="w-16 text-right"><div className="text-[12px] font-black text-ink">${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div><Pct v={pct} className="text-[8.5px]" /></div>
              </div>
              <div className="flex items-center gap-2 mt-[6px] pl-[39px]">
                <span className="w-[76px] inline-flex items-center gap-1"><span className="text-[8px] font-black text-ink-4">P/E</span><span className="text-[9.5px] font-black" style={{ color: peColor }}>{r.pe || "—"}</span><span className="flex-1 h-[3px] rounded-[2px] bg-line-2"><span className="block h-full rounded-[2px]" style={{ width: `${Math.min(100, (r.pe / 60) * 100)}%`, background: peColor }} /></span></span>
                <span className="flex-1 inline-flex items-center gap-1"><span className="text-[8px] font-black text-ink-4">FIC</span><span className="flex-1 h-[6px] rounded-[3px] overflow-hidden flex"><span style={{ width: `${r.fic.buy}%`, background: "#4C8C4A" }} /><span style={{ width: `${r.fic.watch}%`, background: "#E9C46A" }} /><span className="flex-1" style={{ background: "#E5B8AE" }} /></span><span className="text-[9.5px] font-black text-green">{r.fic.buy >= 60 ? "🟢" : "🟡"} {r.fic.buy}%</span></span>
                <span className="w-11 text-right text-[10.5px]"><Signed v={r.ytd} /> <span className="text-[7.5px] text-ink-4">YTD</span></span>
              </div>
            </Link>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[9.5px] font-bold text-ink-4">P/E gauge vs sector · FIC bar = buy/watch/pass mix from 12K+ picks</p>
    </div>
  );
}
