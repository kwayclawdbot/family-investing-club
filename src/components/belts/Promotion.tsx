"use client";
import Link from "next/link";
import type { PromotionSummary } from "@/lib/types";

const COLOR: Record<PromotionSummary["belt"]["color"], { main: string; shadow: string; glow: string }> = {
  white: { main: "#C9BC9E", shadow: "#A89F8D", glow: "rgba(201,188,158,0.25)" },
  yellow: { main: "#E9C46A", shadow: "#B8912E", glow: "rgba(233,196,106,0.3)" },
  green: { main: "#4C8A52", shadow: "#37693C", glow: "rgba(76,138,82,0.25)" },
  blue: { main: "#4E7DA6", shadow: "#3A5F82", glow: "rgba(78,125,166,0.25)" },
  black: { main: "#2E2A21", shadow: "#111", glow: "rgba(46,42,33,0.25)" },
};

/** Belt promotion — the ceremonial moment (canvas v8, artboard 02). One restrained fade/scale on mount, motion-safe only. */
export function Promotion({ p }: { p: PromotionSummary & { lifetimeXp?: number; toNext?: number; nextLabel?: string } }) {
  const c = COLOR[p.belt.color];
  const stats: [number, string][] = [
    [p.lessons, "LESSONS MASTERED"],
    [p.research, "RESEARCH NOTES"],
    [p.drills, "PRACTICE DRILLS"],
    [p.clubActions, "CLUB PROPOSALS & VOTES"],
  ];
  return (
    <div className="relative flex flex-col min-h-full -mx-[18px] px-5 pt-[calc(14px+env(safe-area-inset-top))]">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 30%, #EAF0F5 0%, #FAF3E5 55%)" }} aria-hidden />
      <div className="relative flex-1 flex flex-col items-center text-center motion-safe:animate-[promo_.5s_ease-out]">
        <div className="mt-[30px] text-[12px] font-black tracking-[3px] text-ink-3">BELT PROMOTION</div>
        <div className="mt-[26px] relative w-[190px] h-[190px] rounded-full bg-[#FFFDF7] border border-[#E0D5BE] flex items-center justify-center" style={{ boxShadow: `0 10px 30px ${c.glow}` }}>
          <span className="absolute -inset-[9px] rounded-full border-[5px] opacity-90" style={{ borderColor: c.main }} aria-hidden />
          {/* the belt: a rounded bar with a knot */}
          <div className="w-[120px] h-9 rounded-[10px] flex items-center justify-center overflow-hidden" style={{ background: c.main, boxShadow: "inset 0 -6px 0 rgba(0,0,0,0.15)" }} aria-label={p.belt.label}>
            <span className="w-7 h-full bg-white/25" />
          </div>
        </div>
        <div className="mt-6 text-[14px] font-black text-ink-3 tracking-[1px]">YOU EARNED</div>
        <div className="mt-[2px] text-[34px] font-black leading-tight" style={{ color: c.main }}>{p.belt.label}</div>
        <div className="mt-[6px] text-[12.5px] font-bold text-ink-3">{(p.lifetimeXp ?? p.belt.minXp).toLocaleString()} lifetime XP · level {p.belt.level} of 7{p.toNext ? ` · ${p.toNext} to ${p.nextLabel}` : ""}</div>
        <div className="mt-[18px] grid grid-cols-2 gap-2 w-full">
          {stats.map(([n, l]) => (
            <div key={l} className="bg-[#FFFDF7] border border-line rounded-[13px] p-[10px] text-left">
              <div className="text-[15px] font-black text-ink">{n}</div>
              <div className="text-[9.5px] font-extrabold text-ink-3">{l}</div>
            </div>
          ))}
        </div>
        <p className="mt-[14px] text-[11.5px] font-bold text-ink-3 leading-[1.55] max-w-[300px]">
          Now on your profile, picks, club activity and leaderboards.
        </p>
      </div>
      <div className="relative pb-6 pt-4">
        <Link href="/profile" className="block rounded-[16px] py-4 text-center text-[15px] font-black text-cream-text active:translate-y-[2px] transition" style={{ background: c.main, boxShadow: `0 3px 0 ${c.shadow}` }}>
          Continue
        </Link>
      </div>
      <style>{`@keyframes promo{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
