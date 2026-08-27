"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { Club, ClubMember, PickStance } from "@/lib/types";
import { cx } from "@/components/ui";
import { Sheet } from "@/components/ui/extras";
import { ChevronLeft } from "@/components/ui/icons";
import { useStored } from "./storage";

/* ── member avatars (32px ring, overlapping stack) ─────────────────── */
export function MemberAvatar({ m, size = 32, dashed, className }: { m: Pick<ClubMember, "initial" | "color">; size?: number; dashed?: boolean; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center justify-center rounded-full font-black border-2 border-[#FFFDF7] shrink-0",
        dashed ? "bg-paper border-dashed border-[#D9CDB2] text-ink-4" : cx(m.color, "text-white"),
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.41) }}
      aria-hidden
    >
      {m.initial}
    </span>
  );
}
export function AvatarStack({ members, size = 32, overlap = 9 }: { members: Pick<ClubMember, "initial" | "color">[]; size?: number; overlap?: number }) {
  return (
    <span className="flex">
      {members.map((m, i) => (
        <span key={i} style={{ marginLeft: i ? -overlap : 0 }} className="flex">
          <MemberAvatar m={m} size={size} />
        </span>
      ))}
    </span>
  );
}

/* ── 🔒 My Club | 🌍 Community toggle ──────────────────────────────── */
export function ClubToggle({ active }: { active: "club" | "community" }) {
  const seg = (on: boolean) =>
    cx("flex-1 text-center rounded-[10px] py-2 text-[13px] font-black transition", on ? "bg-[#FFFDF7] text-ink shadow-[0_1px_3px_rgba(46,42,33,0.1)]" : "text-ink-3");
  return (
    <div className="mt-3 flex bg-[#EFE7D6] rounded-[13px] p-1" role="tablist">
      <Link href="/club" role="tab" aria-selected={active === "club"} className={seg(active === "club")}>🔒 My Club</Link>
      <Link href="/community" role="tab" aria-selected={active === "community"} className={seg(active === "community")}>🌍 Community</Link>
    </div>
  );
}

/* ── back · title · right header (66px top pad like the artboards) ── */
export function ScreenHeader({ backHref, title, right, center }: { backHref: string; title?: ReactNode; right?: ReactNode; center?: boolean }) {
  return (
    <div className={cx("flex items-center pt-[14px]", center ? "justify-between" : "gap-[14px]")}>
      <Link href={backHref} aria-label="Back" className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-ink-2">
        <ChevronLeft />
      </Link>
      {typeof title === "string" ? <span className={cx("text-[16px] font-black text-ink", center && "text-[14px]")}>{title}</span> : title}
      {center ? <span className="min-w-9 flex justify-end text-ink-4 font-black">{right ?? "⋮"}</span> : right}
    </div>
  );
}

/* ── section eyebrow ───────────────────────────────────────────────── */
export function Eyebrow({ children, tone = "muted", className }: { children: ReactNode; tone?: "muted" | "orange" | "green" | "purple"; className?: string }) {
  const c = { muted: "text-ink-3", orange: "text-orange", green: "text-green", purple: "text-purple-2" }[tone];
  return <div className={cx("text-[11px] font-black tracking-[0.2px]", c, className)}>{children}</div>;
}

/* ── stance tag ("NVDA · BUY") ─────────────────────────────────────── */
export const stanceLabel: Record<PickStance, string> = { buy: "BUY", watch: "WATCH", pass: "PASS" };
export function StanceTag({ symbol, stance, size = "sm" }: { symbol: string; stance: PickStance; size?: "sm" | "md" }) {
  const tone = { buy: "bg-green-tint text-green", watch: "bg-orange-tint text-orange-2", pass: "bg-paper-2 text-ink-3" }[stance];
  return (
    <span className={cx("inline-flex rounded-[7px] font-black whitespace-nowrap", tone, size === "sm" ? "px-2 py-[3px] text-[10px]" : "px-[11px] py-1 text-[11px] rounded-[9px]")}>
      {symbol} · {stanceLabel[stance]}
    </span>
  );
}
export function dots(n: number) {
  return "●".repeat(n) + "○".repeat(5 - n);
}

/* ── small chip ────────────────────────────────────────────────────── */
export function Chip({ children, tone = "paper", className }: { children: ReactNode; tone?: "paper" | "orange" | "green" | "purple"; className?: string }) {
  const t = {
    paper: "bg-paper border border-line text-ink-3",
    orange: "bg-orange-tint text-orange-2",
    green: "bg-green-tint text-green",
    purple: "bg-purple-tint text-purple-2",
  }[tone];
  return <span className={cx("inline-flex items-center rounded-[9px] px-[11px] py-[5px] text-[10.5px] font-black whitespace-nowrap", t, className)}>{children}</span>;
}

/* ── ticker tile ───────────────────────────────────────────────────── */
const tileTone: Record<string, string> = {
  VOO: "bg-orange-tint text-orange-2", COST: "bg-[#FFFDF4] text-[#BC9227]", NVDA: "bg-green-tint text-green", CEG: "bg-green-tint text-green",
  AAPL: "bg-paper-2 text-ink-2", KO: "bg-[#FBE4E0] text-red", DIS: "bg-purple-tint text-purple-2", AMZN: "bg-orange-tint text-orange-2",
};
export function TickerTile({ symbol, size = 32, className }: { symbol: string; size?: number; className?: string }) {
  return (
    <span
      className={cx("inline-flex items-center justify-center rounded-[10px] font-black shrink-0", tileTone[symbol] ?? "bg-green-tint text-green", className)}
      style={{ width: size, height: size, fontSize: size >= 36 ? 10 : 9.5, borderRadius: size >= 36 ? 11 : 10 }}
      aria-hidden
    >
      {symbol}
    </span>
  );
}

/* ── purple "open proposal" strip ──────────────────────────────────── */
export function ProposalStrip({ text, href, cta = "Vote" }: { text: string; href: string; cta?: string }) {
  return (
    <div className="mt-[10px] bg-purple-tint border border-[#DDD4F0] rounded-[14px] px-[14px] py-[11px] flex items-center gap-[10px]">
      <span className="text-[16px]" aria-hidden>🗳</span>
      <span className="flex-1 text-[12.5px] font-black text-ink">{text}</span>
      <Link href={href} className="bg-purple text-cream-text rounded-[10px] px-3 py-[6px] text-[10.5px] font-black">{cta}</Link>
    </div>
  );
}

/* ── raised primary (3px hard shadow like the artboards) ───────────── */
export function Raised({ tone = "green", children, onClick, disabled, className, type = "button" }: { tone?: "green" | "orange" | "purple"; children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string; type?: "button" | "submit" }) {
  const t = {
    green: "bg-green-2 text-cream-text shadow-[0_3px_0_#3A6B3E]",
    orange: "bg-orange text-cream-text shadow-[0_3px_0_#C96D25]",
    purple: "bg-purple text-cream-text shadow-[0_3px_0_#6B5CA8]",
  }[tone];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cx("w-full rounded-[16px] py-4 text-center text-[15.5px] font-black active:translate-y-[2px] active:shadow-none transition disabled:opacity-50", t, className)}>
      {children}
    </button>
  );
}

/* ── invite sheet (code · link · copy · share) ─────────────────────── */
export function useShareInvite(club: Pick<Club, "inviteCode" | "inviteLink" | "shortName">) {
  const [copied, setCopied] = useState<string | null>(null);
  const url = `https://${club.inviteLink}`;
  async function copy(what: "code" | "link") {
    try { await navigator.clipboard.writeText(what === "code" ? club.inviteCode : url); setCopied(what); setTimeout(() => setCopied(null), 1600); } catch { /* clipboard unavailable */ }
  }
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: club.shortName, text: `Join ${club.shortName} on Family Investing Club`, url });
      else await copy("link");
    } catch { /* dismissed */ }
  }
  return { copied, copy, share, url };
}
export function InviteSheet({ open, onClose, club }: { open: boolean; onClose: () => void; club: Club }) {
  const { copied, copy, share } = useShareInvite(club);
  return (
    <Sheet open={open} onClose={onClose} title="Invite to your club">
      <p className="text-[13px] font-bold text-ink-3">Only people you invite can see picks, votes and discussions.</p>
      <div className="mt-3 bg-paper border border-line rounded-[14px] px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10.5px] font-black text-ink-3">CLUB CODE</div>
          <div className="text-[18px] font-black text-ink tracking-[1px]">{club.inviteCode}</div>
        </div>
        <button onClick={() => copy("code")} className="text-[12px] font-black text-green">{copied === "code" ? "Copied ✓" : "Copy"}</button>
      </div>
      <div className="mt-2 bg-paper border border-line rounded-[14px] px-4 py-3 flex items-center justify-between">
        <div className="text-[12.5px] font-extrabold text-ink truncate">{club.inviteLink}</div>
        <button onClick={() => copy("link")} className="text-[12px] font-black text-green shrink-0 ml-3">{copied === "link" ? "Copied ✓" : "Copy link"}</button>
      </div>
      <div className="mt-4">
        <Raised tone="orange" onClick={share}>Share invite</Raised>
      </div>
    </Sheet>
  );
}

/* ── stored club settings (from /club/create) ──────────────────────── */
export type StoredClub = { name?: string; kind?: Club["kind"]; privacy?: Club["privacy"]; votes?: Club["rules"]["votes"]; kidsCanVote?: boolean; prompt?: string };
export function useStoredClub() {
  return useStored<StoredClub>("fic.club", {});
}
