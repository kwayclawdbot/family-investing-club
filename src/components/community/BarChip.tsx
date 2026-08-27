import type { BeltColor } from "@/lib/types";
import { cx } from "@/components/ui";

const BAR: Record<BeltColor | "public" | "verified", string> = {
  white: "bg-[#F5F0E4] border border-[#C9BC9E]",
  yellow: "bg-[#E9C46A]",
  blue: "bg-[#4E7DA6]",
  purple: "bg-[#8B7BC7]",
  black: "bg-[#2E2A21]",
  public: "bg-[#F5F0E4] border border-[#C9BC9E]",
  verified: "bg-[#4E7DA6]",
};

/** The v9 identity chip: small belt-colour bar + label (canvas artboards 04/05). Belt colours are identity only. */
export function BarChip({ color, label, className }: { color: keyof typeof BAR; label: string; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-[5px] bg-[#FFFDF7] border border-[#E0D5BE] rounded-[7px] px-2 py-[2px] whitespace-nowrap", className)}>
      <span className={cx("w-[14px] h-[5px] rounded-[3px] box-border", BAR[color])} aria-hidden />
      <span className="text-[9.5px] font-black text-[#4A4436]">{label}</span>
    </span>
  );
}

const RING: Record<BeltColor, string> = { white: "#C9BC9E", yellow: "#E9C46A", blue: "#4E7DA6", purple: "#8B7BC7", black: "#2E2A21" };

/** 26–44px avatar with the v9 ring treatment (2.5px belt colour + 2px cream). `ring` null = no ring. */
export function RingAvatar({ initial, bg, ring, size = 26, className }: { initial: string; bg: string; ring: BeltColor | null; size?: number; className?: string }) {
  return (
    <span
      className={cx("rounded-full text-white flex items-center justify-center font-black shrink-0", bg, className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.385), border: ring ? `2.5px solid ${RING[ring]}` : undefined, boxShadow: ring ? "0 0 0 2px #FFFDF7" : undefined }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
