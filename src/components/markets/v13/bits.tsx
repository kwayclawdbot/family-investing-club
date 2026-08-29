import Link from "next/link";
import type { ReactNode } from "react";
import { brandOf } from "@/lib/content/brands";

/** Brand-coloured ticker tile (prototype v2 logo treatment). */
export function Logo({ symbol, size = 30, radius = 9 }: { symbol: string; size?: number; radius?: number }) {
  const fs = size >= 34 ? 8.5 : size >= 28 ? 8 : size >= 24 ? 6.5 : 6;
  return (
    <span className="inline-flex items-center justify-center text-white font-black shrink-0 shadow-[0_2px_5px_rgba(46,42,33,0.25)]" style={{ width: size, height: size, borderRadius: radius, background: brandOf(symbol), fontSize: fs, letterSpacing: -0.3 }}>
      {symbol.toUpperCase().slice(0, 4)}
    </span>
  );
}
/** Inline $TICKER mention with a tiny brand square. */
/** Rendered as a span (not an anchor) so it can sit inside card links without nesting <a>. */
export function Cashtag({ symbol }: { symbol: string }) {
  return (
    <span className="inline whitespace-nowrap">
      <span className="inline-block align-[-1px] mr-[2px] w-[11px] h-[11px] rounded-[4px] shadow-[0_2px_5px_rgba(46,42,33,0.25)]" style={{ background: brandOf(symbol) }} />
      <b className="text-green">${symbol}</b>
    </span>
  );
}
/** Renders "$MSFT" tokens in a string as Cashtags. */
export function CashText({ text }: { text: string }) {
  const parts = text.split(/(\$[A-Z]{1,5})/g);
  return <>{parts.map((p, i) => (/^\$[A-Z]{1,5}$/.test(p) ? <Cashtag key={i} symbol={p.slice(1)} /> : <span key={i}>{p}</span>))}</>;
}
export const Pct = ({ v, className = "" }: { v: number; className?: string }) => (
  <span className={`font-black ${v >= 0 ? "text-[#3A8C4A]" : "text-[#C96A57]"} ${className}`}>{v >= 0 ? "▲" : "▼"}{Math.abs(v).toFixed(1)}%</span>
);
export const Signed = ({ v, className = "" }: { v: number; className?: string }) => (
  <span className={`font-black ${v >= 0 ? "text-[#3A8C4A]" : "text-[#C96A57]"} ${className}`}>{v >= 0 ? "+" : "−"}{Math.abs(v)}%</span>
);
export function FicBar({ buy, watch, height = 13 }: { buy: number; watch: number; height?: number }) {
  return (
    <div className="flex rounded-[7px] overflow-hidden" style={{ height }}>
      <span style={{ width: `${buy}%`, background: "#4C8C4A" }} /><span style={{ width: `${watch}%`, background: "#E9C46A" }} /><span className="flex-1" style={{ background: "#C96A57" }} />
    </div>
  );
}
export const Label = ({ children, className = "" }: { children: ReactNode; className?: string }) => <div className={`text-[11px] font-black text-ink-3 ${className}`}>{children}</div>;
export function BackBar({ title, right, backHref = "/discover" }: { title: ReactNode; right?: ReactNode; backHref?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Link href={backHref} aria-label="Back" className="text-ink-2"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg></Link>
      <span className="text-[16px] font-black text-ink">{title}</span>
      {right && <span className="ml-auto">{right}</span>}
    </div>
  );
}
