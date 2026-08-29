"use client";
import type { ReactNode } from "react";
import { cx } from "@/components/ui";
import { RingedAvatar } from "@/components/belts/identity";
import { useBeltOf, useIdentities } from "@/components/belts/identity-context";
import { BeltChip } from "@/components/ui/belt";

/** Identity colours for the signed-out demo ids only; real members come from the identity registry. */
export const AVATAR_HEX: Record<string, string> = { kway: "#4C8C4A", dad: "#B08968", mom: "#D98E73", andwele: "#7BA05B", arielle: "#E9B949" };
export const INITIAL: Record<string, string> = { kway: "K", dad: "D", mom: "M", andwele: "A", arielle: "A" };

/** A member's avatar. Real members (uuids) resolve their initial and colour from the registry —
 *  the hex/initial maps above only cover the five demo ids, so a real club used to render grey "?". */
export function MemberDot({ memberId, size = 28, ring = true }: { memberId: string; size?: number; ring?: boolean }) {
  const beltOf = useBeltOf();
  const me = useIdentities().find((i) => i.memberId === memberId);
  const hex = AVATAR_HEX[memberId];
  const a = (
    <span
      className={cx("inline-flex items-center justify-center rounded-full text-white font-black shrink-0", !hex && (me?.color ?? "bg-ink-4"))}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), ...(hex ? { background: hex } : null) }}
      aria-hidden
    >
      {me?.initial ?? INITIAL[memberId] ?? "?"}
    </span>
  );
  return ring ? <RingedAvatar belt={beltOf(memberId)}>{a}</RingedAvatar> : a;
}

export function Belt({ memberId }: { memberId: string }) {
  const beltOf = useBeltOf();
  const b = beltOf(memberId);
  return b ? <BeltChip belt={b} /> : null;
}

export function SectionLabel({ children, right, className }: { children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cx("mt-[13px] mb-[6px] flex items-center justify-between", className)}>
      <span className="text-[11px] font-black tracking-[0.5px] text-ink-3">{children}</span>
      {right}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("bg-card border border-line rounded-[15px] px-[14px] py-[3px]", className)}>{children}</div>;
}

export function Ticker({ symbol, tone = "paper", size = 30 }: { symbol: string; tone?: "paper" | "gold" | "green" | "orange"; size?: number }) {
  const t = { paper: "bg-line-2 text-ink-2", gold: "bg-[#FFFDF4] text-[#BC9227]", green: "bg-green-tint text-green", orange: "bg-orange-tint text-orange-2" }[tone];
  return (
    <span className={cx("inline-flex items-center justify-center rounded-[9px] font-black shrink-0", t)} style={{ width: size, height: size, fontSize: symbol.length > 3 ? 8.5 : 9 }} aria-hidden>
      {symbol}
    </span>
  );
}

/** Small ring gauge (win rate / vote progress). */
export function Ring({ pct, size = 26, stroke = 3.5, color = "#4C8C4A", track = "#F0E6D0", children }: { pct: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      {children && <span className="absolute inset-0 flex items-center justify-center">{children}</span>}
    </span>
  );
}

export function MiniSpark({ up = true, width = 34, height = 12 }: { up?: boolean; width?: number; height?: number }) {
  const pts = up ? `0,${height - 2} ${width * 0.3},${height * 0.6} ${width * 0.55},${height * 0.7} ${width * 0.8},${height * 0.3} ${width},2` : `0,2 ${width * 0.3},${height * 0.4} ${width * 0.6},${height * 0.35} ${width},${height - 2}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
      <polyline fill="none" stroke={up ? "#3A8C4A" : "#C96A57"} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" points={pts} />
    </svg>
  );
}

export const pctText = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n)}%`;
