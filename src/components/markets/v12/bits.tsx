import Link from "next/link";
import type { ReactNode } from "react";
export const Eyebrow = ({ children, className = "" }: { children: ReactNode; className?: string }) => <div className={`text-[11px] font-black text-ink-3 tracking-[0.3px] ${className}`}>{children}</div>;
export function Ticker({ symbol, tone = "green", size = 36 }: { symbol: string; tone?: "green" | "gold" | "purple"; size?: number }) {
  const t = tone === "gold" ? "bg-[#FFFDF4] text-[#BC9227]" : tone === "purple" ? "bg-purple-tint text-purple-2" : "bg-green-tint text-green";
  return <span className={`inline-flex items-center justify-center rounded-[12px] font-black shrink-0 ${t}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.26) }}>{symbol}</span>;
}
export function BeltPill({ label, color }: { label: string; color: string }) {
  return <span className="inline-flex items-center gap-1 rounded-[7px] bg-[#FFFDF7] border border-line px-[6px] py-[1px] text-[9px] font-black text-[#4A4436]"><span className="inline-block w-[10px] h-[5px] rounded-[2px]" style={{ background: color }} />{label}</span>;
}
export function Person({ initial, color, name, belt, beltColor, line, action, href }: { initial: string; color: string; name: string; belt: string; beltColor: string; line: string; action: string; href: string }) {
  return (
    <div className="bg-card border border-line rounded-[15px] px-[13px] py-[11px] flex items-center gap-[11px]">
      <span className="w-9 h-9 rounded-full text-white font-black text-[14px] flex items-center justify-center shrink-0" style={{ background: color }}>{initial}</span>
      <div className="flex-1 min-w-0"><div className="flex items-center gap-[6px]"><span className="text-[13.5px] font-black text-ink">{name}</span><BeltPill label={belt} color={beltColor} /></div><div className="text-[10.5px] font-bold text-ink-3 truncate">{line}</div></div>
      <Link href={href} className="rounded-[10px] border border-purple-line text-purple-2 px-3 py-[6px] text-[10px] font-black">{action}</Link>
    </div>
  );
}
