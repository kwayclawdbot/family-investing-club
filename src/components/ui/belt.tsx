import type { Belt, BeltColor } from "@/lib/types";
import { cx } from "./index";

/**
 * Belt identity primitives. Belt colours are reserved for identity — never reused as UI accents.
 * Ring on the avatar + chip beside the name, everywhere a member appears.
 */
const RING: Record<BeltColor, string> = {
  white: "ring-[#E6DFCF]",   // border keeps it visible on cream
  yellow: "ring-[#E9B949]",
  blue: "ring-[#3E7BC7]",
  purple: "ring-[#7B5CC7]",
  black: "ring-[#2E2A21]",
};
const CHIP: Record<BeltColor, string> = {
  white: "bg-white text-ink-2 border border-[#E6DFCF]",
  yellow: "bg-[#FBEFC9] text-[#7A5A00] border border-[#E9B949]",
  blue: "bg-[#E1ECFA] text-[#1F4F8F] border border-[#3E7BC7]",
  purple: "bg-[#EBE4F8] text-[#4B3690] border border-[#7B5CC7]",
  black: "bg-[#2E2A21] text-cream-text border border-[#2E2A21]",
};
const SWATCH: Record<BeltColor, string> = {
  white: "bg-white border border-[#E6DFCF]",
  yellow: "bg-[#E9B949]",
  blue: "bg-[#3E7BC7]",
  purple: "bg-[#7B5CC7]",
  black: "bg-[#2E2A21]",
};

export function BeltChip({ belt, size = "sm", className }: { belt: Belt; size?: "sm" | "md"; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-[6px] font-extrabold whitespace-nowrap", size === "sm" ? "px-[6px] py-[2px] text-[9.5px]" : "px-2 py-[3px] text-[11px]", CHIP[belt.color], className)}>
      <span className={cx("inline-block w-[7px] h-[7px] rounded-full", SWATCH[belt.color])} aria-hidden />
      {size === "sm" ? belt.short : belt.label}
    </span>
  );
}

/** Wrap an Avatar (or any circle) to add the belt ring. */
export function BeltRing({ belt, children, className, width = 2 }: { belt: Belt; children: React.ReactNode; className?: string; width?: 2 | 3 }) {
  return (
    <span className={cx("inline-flex rounded-full ring-offset-2 ring-offset-paper", width === 3 ? "ring-[3px]" : "ring-2", RING[belt.color], className)} title={belt.label}>
      {children}
    </span>
  );
}

export function BeltSwatch({ color, className }: { color: BeltColor; className?: string }) {
  return <span className={cx("inline-block w-3 h-3 rounded-[4px]", SWATCH[color], className)} aria-hidden />;
}
