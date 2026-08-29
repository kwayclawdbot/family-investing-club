"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo, Pct, Signed, BackBar } from "./bits";
import type { ScreenerHit, ScreenerResult } from "@/lib/live/screener";
import type { Sector } from "@/lib/server/shared/screener-sectors";

const chipOn = "bg-green-tint border border-[#A9C69E] text-green rounded-[15px] px-3 py-[5px] text-[10px] font-black whitespace-nowrap";
const chipOff = "bg-card border border-line text-ink-3 rounded-[15px] px-3 py-[5px] text-[10px] font-extrabold whitespace-nowrap";
const CAPS = [["any", "Any size"], ["mega", "Mega (>$200B)"], ["large", "Large ($10–200B)"], ["mid", "Mid ($2–10B)"], ["small", "Small (<$2B)"]] as const;
const SORTS = [["chg_1m", "1M"], ["chg_3m", "3M"], ["chg_1d", "Today"], ["mcap", "Size"]] as const;
const fmtCap = (n: number | null) => (n === null ? "—" : n >= 1e12 ? `$${(n / 1e12).toFixed(1)}T` : n >= 1e9 ? `$${Math.round(n / 1e9)}B` : n >= 1e6 ? `$${Math.round(n / 1e6)}M` : `$${n}`);

/**
 * Stock Screener over the real universe (`screener_metrics`, ~11.7k US listings recomputed nightly).
 * Filters are URL state so the server does the work — the browser never holds the universe.
 */
export function Screener({ result, filters }: { result: ScreenerResult | null; filters: Record<string, string> }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(filters.q ?? "");
  const [sectorOpen, setSectorOpen] = useState(false);
  const [capOpen, setCapOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) { if (v === null || v === "") next.delete(k); else next.set(k, v); }
    start(() => router.replace(`/screener?${next.toString()}`, { scroll: false }));
  };
  // Typing shouldn't hit the database on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => { if ((filters.q ?? "") !== q) set({ q: q || null }); }, 350);
    return () => clearTimeout(id);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps -- debounce on the input only

  const sector = filters.sector || "";
  const cap = filters.cap || "any";
  const sort = filters.sort || "chg_1m";
  const on = (k: string) => filters[k] === "1";
  const active = [sector, cap !== "any" ? "1" : "", on("up1m") ? "1" : "", on("ema50") ? "1" : "", on("fic") ? "1" : "", filters.kind, on("all") ? "1" : ""].filter(Boolean).length;
  const rows: ScreenerHit[] = result?.rows ?? [];
  // Cap/sector come from a nightly round-robin over ticker-details; early on almost nothing has them.
  const sparse = !!result && !rows.length && ((cap !== "any" && result.coverage.mcap < result.universe / 4) || (!!sector && result.coverage.sector < result.universe / 4));
  const save = () => { try { localStorage.setItem("fic.screens", JSON.stringify({ filters, savedAt: Date.now(), symbols: rows.map((r) => r.ticker) })); } catch { /* ignore */ } setSaved(true); setTimeout(() => setSaved(false), 1600); };

  return (
    <div className="pt-[14px] pb-6">
      <BackBar title="Stock Screener" right={<button onClick={save} className="rounded-[10px] bg-green-2 text-cream-text px-3 py-[6px] text-[10px] font-black">{saved ? "Saved ✓" : "💾 Save watchlist"}</button>} />
      <label className="mt-[9px] flex items-center gap-[9px] bg-card border border-line rounded-[13px] px-[13px] py-[9px]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A89F8D" strokeWidth={2.5}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ticker or company…" className="flex-1 bg-transparent outline-none text-[12.5px] font-bold text-ink placeholder:text-ink-4" />
      </label>

      <div className="mt-[9px] bg-card border border-line rounded-[14px] px-[13px] py-[10px]">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black text-ink-3">FILTERS · {active} ACTIVE</span>
          <button onClick={() => { setQ(""); start(() => router.replace("/screener", { scroll: false })); }} className="text-[9.5px] font-black text-orange-2">Reset</button>
        </div>
        <div className="flex gap-[5px] mt-[7px] flex-wrap">
          <span className="relative">
            <button onClick={() => setSectorOpen((v) => !v)} className={sector ? chipOn : chipOff}>{sector || "All sectors"} ▾</button>
            {sectorOpen && (
              <span className="absolute z-20 top-8 left-0 bg-card border border-line rounded-[12px] p-1 shadow-lg flex flex-col min-w-[170px] max-h-[260px] overflow-auto">
                <button onClick={() => { set({ sector: null }); setSectorOpen(false); }} className="text-left px-3 py-[6px] text-[11px] font-extrabold text-ink rounded-[8px] hover:bg-paper-2">All sectors</button>
                {(result?.sectors ?? []).map((s: Sector) => <button key={s} onClick={() => { set({ sector: s }); setSectorOpen(false); }} className="text-left px-3 py-[6px] text-[11px] font-extrabold text-ink rounded-[8px] hover:bg-paper-2">{s}</button>)}
              </span>
            )}
          </span>
          <button onClick={() => set({ up1m: on("up1m") ? null : "1" })} className={on("up1m") ? chipOn : chipOff}>Up this month {on("up1m") ? "✕" : ""}</button>
          <button onClick={() => set({ ema50: on("ema50") ? null : "1" })} className={on("ema50") ? chipOn : chipOff}>Above its 50-day {on("ema50") ? "✕" : ""}</button>
          <button onClick={() => set({ fic: on("fic") ? null : "1" })} className={on("fic") ? chipOn : chipOff}>Picked by FIC clubs {on("fic") ? "✕" : ""}</button>
          <button onClick={() => set({ all: on("all") ? null : "1" })} className={on("all") ? chipOn : chipOff}>Include microcaps {on("all") ? "✕" : ""}</button>
          <button onClick={() => set({ kind: filters.kind === "etf" ? null : "etf" })} className={filters.kind === "etf" ? chipOn : chipOff}>ETFs only {filters.kind === "etf" ? "✕" : ""}</button>
          <span className="relative">
            <button onClick={() => setCapOpen((v) => !v)} className={cap !== "any" ? chipOn : chipOff}>Mkt cap{cap !== "any" ? ` · ${cap}` : ""} ▾</button>
            {capOpen && <span className="absolute z-20 top-8 left-0 bg-card border border-line rounded-[12px] p-1 shadow-lg flex flex-col min-w-[150px]">{CAPS.map(([c, label]) => <button key={c} onClick={() => { set({ cap: c === "any" ? null : c }); setCapOpen(false); }} className="text-left px-3 py-[6px] text-[11px] font-extrabold text-ink rounded-[8px] hover:bg-paper-2">{label}</button>)}</span>}
          </span>
        </div>
        <div className="flex gap-2 mt-[9px] pt-[9px] border-t border-paper-2 items-center flex-wrap">
          <span className="text-[8.5px] font-black text-ink-4">QUICK SCREENS</span>
          <Link href="/theme/nuclear-energy" className="bg-orange-tint text-orange-2 rounded-[9px] px-[9px] py-[3px] text-[9px] font-black">⚡ Nuclear</Link>
          <button onClick={() => start(() => router.replace("/screener?cap=mega&up1m=1", { scroll: false }))} className="bg-purple-tint text-purple-2 rounded-[9px] px-[9px] py-[3px] text-[9px] font-black">👨‍👩‍👧 Big &amp; rising</button>
          <button onClick={() => start(() => router.replace("/screener?kind=etf&sort=mcap", { scroll: false }))} className="bg-green-tint text-green rounded-[9px] px-[9px] py-[3px] text-[9px] font-black">🧺 Biggest ETFs</button>
        </div>
      </div>

      <div className="mt-[9px] flex items-center justify-between">
        <span className="text-[10.5px] font-black text-ink-3">{pending ? "SEARCHING…" : `${(result?.matched ?? 0).toLocaleString()} MATCHES`}</span>
        <div className="flex gap-1">{SORTS.map(([s, label]) => <button key={s} onClick={() => set({ sort: s })} className={sort === s ? "bg-ink text-cream-text rounded-[9px] px-[10px] py-1 text-[9px] font-black" : "bg-card border border-line text-ink-3 rounded-[9px] px-[10px] py-1 text-[9px] font-extrabold"}>{label}</button>)}</div>
      </div>

      <div className={`mt-[6px] bg-card border border-line rounded-[15px] px-[14px] py-[3px] ${pending ? "opacity-60" : ""}`}>
        {!rows.length && (
          <div className="py-6 text-center text-[11px] font-bold text-ink-3">
            {!result ? "The screener is refreshed nightly; nothing loaded yet."
              : sparse ? `Market cap and sector are still filling in — ${result.coverage.mcap.toLocaleString()} of ${result.universe.toLocaleString()} listings have them so far. Try the price filters instead.`
              : "No matches — loosen a filter."}
          </div>
        )}
        {rows.map((r, i) => (
          <Link key={r.ticker} href={`/discover/${r.ticker}`} className={`block py-[9px] ${i < rows.length - 1 ? "border-b border-paper-2" : ""}`}>
            <div className="flex items-center gap-[9px]">
              <Logo symbol={r.ticker} />
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-black text-ink truncate">{r.name} <span className="text-[9px] font-extrabold text-ink-4">{r.ticker}</span></div>
                <div className="text-[8.5px] font-bold text-ink-3 truncate">{[r.sector ?? (r.type === "etf" ? "ETF" : null), fmtCap(r.mcap), r.ficPicks ? `${r.ficPicks} FIC ${r.ficPicks === 1 ? "pick" : "picks"}` : null, r.aboveEma50 ? "above its 50-day" : null].filter(Boolean).join(" · ")}</div>
              </div>
              <div className="w-16 text-right">
                <div className="text-[12px] font-black text-ink">{r.price === null ? "—" : `$${r.price.toLocaleString(undefined, { maximumFractionDigits: r.price < 10 ? 2 : 0 })}`}</div>
                {r.chg1d !== null && <Pct v={r.chg1d} className="text-[8.5px]" />}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-[6px] pl-[39px] text-[10px]">
              <span className="text-ink-4 font-black text-[8px]">1M</span>{r.chg1m === null ? <span className="text-ink-4 font-black">—</span> : <Signed v={r.chg1m} />}
              <span className="text-ink-4 font-black text-[8px]">3M</span>{r.chg3m === null ? <span className="text-ink-4 font-black">—</span> : <Signed v={r.chg3m} />}
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-2 text-center text-[9.5px] font-bold text-ink-4">
        {result ? `${result.universe.toLocaleString()} US listings${on("all") ? "" : " · $1+, 100k+ average volume, splits excluded"}${result.asOf ? ` · as of ${new Date(result.asOf).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""} · end-of-day` : "end-of-day data"}
      </p>
    </div>
  );
}
