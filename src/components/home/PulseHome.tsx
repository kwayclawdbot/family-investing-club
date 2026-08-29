"use client";
import Link from "next/link";
import { useState } from "react";
import type { HomePulse, Belt } from "@/lib/types";
import { cx } from "@/components/ui";
import { BellIcon } from "@/components/ui/icons";
import { BarChip, RingAvatar } from "@/components/community/BarChip";
import { PulseChart, markerColor } from "./PulseChart";
import { useBeltOf } from "@/components/belts/identity-context";

const AV: Record<string, { bg: string; initial: string }> = {
  kway: { bg: "bg-green-2", initial: "K" }, andwele: { bg: "bg-green-3", initial: "A" }, mom: { bg: "bg-coral", initial: "M" }, dad: { bg: "bg-[#B08968]", initial: "D" }, arielle: { bg: "bg-gold", initial: "A" },
};
const GUEST: Record<string, { bg: string; initial: string; ring: "blue" | null }> = { Sarah: { bg: "bg-coral", initial: "S", ring: "blue" } };

function partOfDay(h: number) { return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening"; }
const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

/** Home v3 — performance pulse (canvas v9, artboard 04). One hero, borderless stream, one continue card. */
export function PulseHome({ p, belt, nextBeltLabel, xpToNext, extras }: { p: HomePulse; belt: Belt; nextBeltLabel: string | null; xpToNext: number | null; extras?: React.ReactNode }) {
  const beltOf = useBeltOf();
  const [scope, setScope] = useState<"me" | "club">("me");
  const [range, setRange] = useState(p.ranges[0]);
  const [hour] = useState(() => new Date().getHours());
  const hero = scope === "me" ? p.me : p.club;
  const me = AV.kway;
  const xpPct = xpToNext != null ? Math.round((1 - xpToNext / (xpToNext + (p.tiles.xp % 1000 || 560))) * 100) : 100;

  return (
    <div className="pb-6 pt-[14px]">
      {/* identity header — Profile lives behind the avatar */}
      <div className="flex items-center gap-[11px]">
        <Link href="/profile" aria-label="Profile"><RingAvatar initial={me.initial} bg={me.bg} ring={belt.color} size={44} /></Link>
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-black text-ink">Good {partOfDay(hour)}, Kway</div>
          <div className="flex items-center gap-[6px] mt-[2px]">
            <BarChip color={belt.color} label={belt.label} />
            <span className="text-[10.5px] font-extrabold text-ink-3">{p.tiles.xp.toLocaleString()} XP{xpToNext != null && nextBeltLabel ? ` · ${xpToNext} to ${nextBeltLabel.replace(" Belt", "")}` : ""}</span>
          </div>
        </div>
        <Link href="/profile/notifications" aria-label="Notifications" className="relative w-9 h-9 rounded-full bg-card border border-line flex items-center justify-center text-ink-2">
          <BellIcon size={16} />
          <span className="absolute top-[6px] right-[7px] w-[7px] h-[7px] rounded-full bg-orange border-[1.5px] border-white" />
        </Link>
      </div>

      {/* Me | My Club */}
      <div className="mt-[11px] flex bg-[#EFE7D6] rounded-[12px] p-[3px]" role="tablist">
        {(["me", "club"] as const).map((s) => (
          <button key={s} role="tab" aria-selected={scope === s} onClick={() => setScope(s)} className={cx("flex-1 rounded-[9px] py-[7px] text-[12.5px] font-black transition", scope === s ? "bg-ink text-cream-text" : "text-ink-3")}>
            {s === "me" ? "Me" : "My Club"}
          </button>
        ))}
      </div>

      {/* hero */}
      <div className="mt-[10px]">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-[30px] font-black text-ink">{money(hero.value)}</span>
            <span className="ml-2 text-[13px] font-black text-[#3A8C4A]">+{hero.ytdPct.toFixed(2)}%</span>
          </div>
          <span className="text-[10.5px] font-extrabold text-ink-4">{scope === "me" ? p.me.note : "club model · practice"}</span>
        </div>
        <PulseChart data={hero.series} markers={hero.markers} />
        <div className="flex justify-between items-center">
          <div className="flex gap-[5px]" role="tablist">
            {p.ranges.map((r) => (
              <button key={r} role="tab" aria-selected={range === r} onClick={() => setRange(r)} className={cx("rounded-[8px] text-[10px] font-black", range === r ? "bg-ink text-cream-text px-[10px] py-1" : "text-ink-4 font-extrabold px-[6px] py-1")}>{r}</button>
            ))}
          </div>
          <span className="text-[9.5px] font-extrabold text-ink-3">
            {hero.markers.map((m, i) => (
              <span key={m.label}>{i > 0 && " · "}<span style={{ color: markerColor(m.kind) }}>●</span> {m.label}</span>
            ))}
          </span>
        </div>
      </div>

      {/* three tiles */}
      <div className="flex gap-2 mt-[10px]">
        <div className="flex-1 bg-card border border-line rounded-[13px] px-[11px] py-[9px]">
          <div className="text-[9px] font-black text-ink-3">BEST PICK</div>
          <div className="flex items-center gap-[5px] mt-[3px]">
            <span className="text-[13px] font-black text-ink">{p.tiles.bestPick.symbol}</span>
            <svg width="38" height="16" viewBox="0 0 38 16" preserveAspectRatio="none" className="shrink-0" aria-hidden><polyline fill="none" stroke="#4C8C4A" strokeWidth="2" points="0,13 8,10 16,12 24,6 31,8 38,2" /></svg>
          </div>
          <div className="text-[10px] font-black text-[#3A8C4A]">+{p.tiles.bestPick.pct}%</div>
        </div>
        <div className="flex-1 bg-card border border-line rounded-[13px] px-[11px] py-[9px]">
          <div className="text-[9px] font-black text-ink-3">CLUB RANK</div>
          <div className="text-[15px] font-black text-ink mt-[3px]">#{p.tiles.clubRank.rank} <span className="text-[9.5px] text-ink-3">of {p.tiles.clubRank.of}</span></div>
          <div className="text-[10px] font-extrabold text-ink-3">picks YTD</div>
        </div>
        <div className="flex-1 bg-card border border-line rounded-[13px] px-[11px] py-[9px]">
          <div className="text-[9px] font-black text-ink-3">XP</div>
          <div className="text-[15px] font-black text-purple-2 mt-[3px]">{p.tiles.xp.toLocaleString()}</div>
          <div className="h-1 rounded-[2px] bg-line-2 mt-1 overflow-hidden"><div className="h-full rounded-[2px] bg-purple" style={{ width: `${Math.min(100, Math.max(5, xpPct))}%` }} /></div>
        </div>
      </div>

      {extras}
      {/* club snapshot + ONE decision */}
      <div className="mt-3 bg-card border border-line rounded-[16px] px-[15px] py-3">
        <Link href="/club" className="flex items-center gap-[9px]">
          <span className="flex">
            {(["kway", "andwele", "mom"] as const).map((id, i) => (
              <span key={id} className={i > 0 ? "-ml-2 flex" : "flex"}><RingAvatar initial={AV[id].initial} bg={AV[id].bg} ring={beltOf(id)?.color ?? null} /></span>
            ))}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-black text-ink">{p.clubSnapshot.name} <span className="text-[10px] text-ink-3">🔒 · {p.clubSnapshot.members}</span></span>
            <span className="block text-[10px] font-extrabold text-ink-3">{money(p.clubSnapshot.value)} · +{p.clubSnapshot.ytdPct.toFixed(2)}% · {p.clubSnapshot.verified}</span>
          </span>
          <span className="text-ink-4 font-black">›</span>
        </Link>
        <div className="mt-[9px] bg-purple-tint border border-[#DDD4F0] rounded-[12px] px-3 py-[9px] flex items-center gap-[9px]">
          <VoteRing voted={p.decision.voted} eligible={p.decision.eligible} />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-black text-ink">{p.decision.text}</div>
            <div className="text-[10px] font-extrabold text-ink-3">{p.decision.voted}/{p.decision.eligible} voted · {p.decision.hoursLeft} hours left</div>
          </div>
          <Link href={`/club/vote/${p.decision.proposalId}`} className="bg-purple text-cream-text rounded-[10px] px-[13px] py-[7px] text-[11px] font-black">Vote</Link>
        </div>
      </div>

      {/* YOUR WORLD — short borderless stream */}
      <div className="mt-3 mb-1 flex justify-between"><span className="text-[12px] font-black text-ink-3">YOUR WORLD</span></div>
      <div>
        {p.stream.map((s, i) => {
          const a = s.actorId ? AV[s.actorId] : undefined;
          const g = !a ? GUEST[s.actor] : undefined;
          const ring = s.actorId ? beltOf(s.actorId)?.color ?? null : g?.ring ?? null;
          return (
            <Link key={s.id} href={s.href} className={cx("flex items-center gap-[9px] py-[7px]", i < p.stream.length - 1 && "border-b border-[#F1E8D4]")}>
              <RingAvatar initial={a?.initial ?? g?.initial ?? s.actor[0]} bg={a?.bg ?? g?.bg ?? "bg-ink-4"} ring={ring} />
              <span className="flex-1 text-[12px] font-bold text-[#4A4436] min-w-0"><b>{s.actor}</b> {s.text}</span>
              {s.pct != null ? (
                <>
                  <svg width="40" height="14" viewBox="0 0 40 14" preserveAspectRatio="none" className="shrink-0" aria-hidden><polyline fill="none" stroke="#4C8C4A" strokeWidth="2" points="0,11 10,8 20,10 30,4 40,2" /></svg>
                  <span className="text-[10px] font-black text-[#3A8C4A]">+{s.pct}%</span>
                </>
              ) : (
                <span className="text-[10px] font-extrabold text-ink-4">{s.ago}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* one continue card */}
      <Link href={p.continueCard.href} className="mt-[9px] flex items-center gap-[11px] rounded-[14px] border border-[#DDD4F0] px-[14px] py-[11px]" style={{ background: "linear-gradient(105deg,#EFEBF8,#F7F3FC)" }}>
        <span className="w-[30px] h-[30px] rounded-[10px] bg-purple text-white flex items-center justify-center text-[14px]">▶</span>
        <span className="flex-1 min-w-0">
          <span className="block text-[12.5px] font-black text-ink">{p.continueCard.title}</span>
          <span className="block text-[10px] font-extrabold text-ink-3">{p.continueCard.sub}</span>
        </span>
      </Link>
    </div>
  );
}

/** Small vote ring: voted / eligible. */
export function VoteRing({ voted, eligible, size = 30 }: { voted: number; eligible: number; size?: number }) {
  const r = size * 0.4, c = 2 * Math.PI * r, f = c * (voted / Math.max(1, eligible));
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }} aria-label={`${voted} of ${eligible} voted`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E3D9F5" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#8B7BC7" strokeWidth="4" strokeDasharray={`${f} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
    </span>
  );
}
