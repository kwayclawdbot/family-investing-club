"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Company, DiscoverCategory } from "@/lib/types";
import { Card } from "@/components/ui";
import { ChevronDown } from "@/components/ui/icons";
import { SymbolTile } from "./SymbolTile";
import { money, pct } from "./format";

/** Honest, fixture-level attributes for the simplified filter (a real screener arrives with the FTA engine). */
const ATTR: Record<string, { sector: string; size: string; dividend: boolean }> = {
  AAPL: { sector: "Technology", size: "Large", dividend: true },
  NVDA: { sector: "Technology", size: "Large", dividend: false },
  KO: { sector: "Consumer", size: "Large", dividend: true },
  VOO: { sector: "Index fund", size: "Fund", dividend: true },
};
const SECTORS = ["Technology", "Consumer", "Index fund"];
const SIZES = ["Large", "Fund"];

export function DiscoverView({ categories, companies }: { categories: DiscoverCategory[]; companies: Company[] }) {
  const [open, setOpen] = useState<string | null>(categories[0]?.id ?? null);
  const [adv, setAdv] = useState(false);
  const [sector, setSector] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [div, setDiv] = useState(false);
  const byId = Object.fromEntries(companies.map((c) => [c.symbol, c]));

  const filtered = useMemo(
    () =>
      companies.filter((c) => {
        const a = ATTR[c.symbol];
        if (!a) return false;
        if (sector && a.sector !== sector) return false;
        if (size && a.size !== size) return false;
        if (div && !a.dividend) return false;
        return true;
      }),
    [companies, sector, size, div]
  );
  const anyFilter = sector || size || div;

  const chip = (on: boolean) =>
    `h-[30px] px-3 rounded-[10px] text-[12px] font-extrabold border ${on ? "bg-green text-cream-text border-green" : "bg-card border-line text-ink-3"}`;

  return (
    <>
      <div className="flex flex-col gap-3 mt-3">
        {categories.map((cat) => {
          const isOpen = open === cat.id;
          return (
            <Card key={cat.id} className="!p-0 overflow-hidden">
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : cat.id)} className="w-full text-left p-4">
                <div className="flex items-start gap-3">
                  <span className="w-11 h-11 rounded-[14px] bg-paper-2 flex items-center justify-center text-[22px] shrink-0" aria-hidden>{cat.emoji}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-black text-ink">{cat.title}</span>
                    <span className="block text-[12.5px] font-bold text-ink-3 leading-[1.45]">{cat.blurb}</span>
                    <span className="mt-2 flex flex-wrap gap-[5px]">
                      {cat.symbols.map((s) => (
                        <span key={s} className="rounded-[6px] bg-paper-2 px-[7px] py-[2px] text-[10.5px] font-extrabold text-ink-2">{s}</span>
                      ))}
                    </span>
                  </span>
                  <ChevronDown className={`text-ink-4 transition mt-1 ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-paper-2 px-4 pb-2">
                  <div className="pt-3 text-[11px] font-extrabold text-green tracking-[0.3px] uppercase">Why these matched</div>
                  <p className="text-[12.5px] font-bold text-ink-2">{cat.why}</p>
                  {cat.symbols.map((s, i) => {
                    const c = byId[s];
                    if (!c) return null;
                    return (
                      <Link key={s} href={`/discover/${s}`} className={`flex items-center gap-[11px] py-[10px] ${i < cat.symbols.length - 1 ? "border-b border-paper-2" : ""}`}>
                        <SymbolTile symbol={s} size={32} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13px] font-extrabold text-ink truncate">{c.name}</span>
                          <span className="block text-[11px] font-bold text-ink-4">{s}</span>
                        </span>
                        <span className="text-right">
                          <span className="block text-[13px] font-black text-ink">${money(c.price)}</span>
                          <span className={`block text-[11px] font-extrabold ${c.changePct >= 0 ? "text-[#3A8C4A]" : "text-red"}`}>{pct(c.changePct, 2)}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <button type="button" aria-expanded={adv} onClick={() => setAdv((v) => !v)} className="mt-4 w-full flex items-center justify-between text-left">
        <span>
          <span className="block text-[15px] font-black text-ink">Advanced filters</span>
          <span className="block text-[11px] font-bold text-ink-4">Simplified — full screener arrives with the FTA engine</span>
        </span>
        <ChevronDown className={`text-ink-4 transition ${adv ? "rotate-180" : ""}`} />
      </button>
      {adv && (
        <Card className="mt-2">
          <div className="text-[11px] font-extrabold text-ink-3 uppercase tracking-[0.3px]">Sector</div>
          <div className="mt-2 flex flex-wrap gap-[6px]">
            {SECTORS.map((s) => (
              <button key={s} type="button" aria-pressed={sector === s} onClick={() => setSector(sector === s ? null : s)} className={chip(sector === s)}>{s}</button>
            ))}
          </div>
          <div className="mt-3 text-[11px] font-extrabold text-ink-3 uppercase tracking-[0.3px]">Size</div>
          <div className="mt-2 flex flex-wrap gap-[6px]">
            {SIZES.map((s) => (
              <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(size === s ? null : s)} className={chip(size === s)}>{s}</button>
            ))}
            <button type="button" aria-pressed={div} onClick={() => setDiv((v) => !v)} className={chip(div)}>Pays a dividend</button>
          </div>
          <div className="mt-3 border-t border-paper-2 pt-2">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-[12.5px] font-bold text-ink-3">Nothing in the sample universe matches.</div>
            ) : (
              filtered.map((c, i) => (
                <Link key={c.symbol} href={`/discover/${c.symbol}`} className={`flex items-center gap-[11px] py-[10px] ${i < filtered.length - 1 ? "border-b border-paper-2" : ""}`}>
                  <SymbolTile symbol={c.symbol} size={32} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-extrabold text-ink truncate">{c.name}</span>
                    <span className="block text-[11px] font-bold text-ink-4">{ATTR[c.symbol].sector} · {ATTR[c.symbol].dividend ? "dividend" : "no dividend"}</span>
                  </span>
                  <span className="text-[13px] font-black text-ink">${money(c.price)}</span>
                </Link>
              ))
            )}
            {anyFilter && <div className="pt-2 text-[11px] font-bold text-ink-4 text-center">{filtered.length} of {companies.length} sample companies</div>}
          </div>
        </Card>
      )}
    </>
  );
}
