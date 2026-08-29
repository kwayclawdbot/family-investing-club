"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cx } from "@/components/ui";
import { ChevronLeft } from "@/components/ui/icons";
import { RingAvatar } from "@/components/community/BarChip";
import { CashText } from "@/components/markets/v13/bits";
import { clubApi } from "@/lib/live/client-club";
import type { LiveNotification } from "@/lib/live/notifications";

export type NeedsYouItem = { id: string; emoji: string; tint: string; title: string; sub: string; action: { label: string; href: string; tone: "purple" | "green" | "orange" } };

const TONE = { purple: "bg-purple text-cream-text", green: "bg-green-tint text-green", orange: "bg-orange text-cream-text" };
/** A Kai alert and a club announcement shouldn't wear the same generic bell. */
const TYPE_ICON: Record<string, { emoji: string; tint: string }> = {
  alert: { emoji: "✦", tint: "#EFEBF8" },
  announcement: { emoji: "📣", tint: "#FBEDD9" },
  new_lesson: { emoji: "📚", tint: "#EAF2E3" },
  recording: { emoji: "▶", tint: "#F5F0E4" },
};
const KIND_ICON: Record<string, { emoji: string; tint: string }> = {
  club: { emoji: "🗳", tint: "#EFEBF8" },
  lesson: { emoji: "📚", tint: "#EAF2E3" },
  live: { emoji: "🎥", tint: "#FBEDD9" },
  family: { emoji: "👨‍👩‍👧", tint: "#F5F0E4" },
  system: { emoji: "🔔", tint: "#F5F0E4" },
};

/**
 * Notifications — the member's real `notifications` rows. "Needs you" is what the app is actually
 * waiting on them for (an open club vote they haven't cast, plus unread replies/mentions/asks);
 * everything else is an update. Reading one acks it (`read_at`), which is the only column a member
 * may update. Every row deep-links to the thing it is about.
 */
export function NotificationsV3({ items, needsYou }: { items: LiveNotification[]; needsYou: NeedsYouItem[] }) {
  const router = useRouter();
  const [acked, setAcked] = useState<Set<string>>(new Set());
  const [allRead, setAllRead] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());

  const ack = async (id: string) => {
    setAcked((s) => new Set(s).add(id));
    const r = await clubApi.ack(id);
    if (r.ok) router.refresh();
  };
  const markAll = async () => {
    setAllRead(true);
    const r = await clubApi.ack();
    if (r.ok) router.refresh();
  };
  const open = needsYou.filter((n) => !done.has(n.id));
  const isRead = (n: LiveNotification) => n.read || allRead || acked.has(n.id);

  return (
    <div className="pt-[14px] pb-6">
      <div className="flex items-center gap-3">
        <Link href="/home" aria-label="Back" className="text-ink-2"><ChevronLeft size={20} /></Link>
        <span className="text-[16px] font-black text-ink">Notifications</span>
        <button type="button" onClick={() => void markAll()} className="ml-auto text-[10.5px] font-extrabold text-green">Mark all read</button>
      </div>

      <div className="mt-[13px] mb-[6px] text-[11px] font-black text-orange-2">NEEDS YOU · {open.length}</div>
      {open.length ? (
        <div className="bg-card border border-line rounded-[15px] px-[14px] py-[3px]">
          {open.map((n, i) => (
            <div key={n.id} className={cx("flex items-center gap-[11px] py-[11px]", i < open.length - 1 && "border-b border-paper-2")}>
              <span className="flex items-center justify-center shrink-0" style={{ width: 34, height: 34, borderRadius: 11, background: n.tint, fontSize: 15 }} aria-hidden>{n.emoji}</span>
              <div className="flex-1 min-w-0"><div className="text-[12.5px] font-extrabold text-ink"><CashText text={n.title} /></div><div className="text-[10px] font-bold text-ink-3">{n.sub}</div></div>
              <Link href={n.action.href} onClick={() => { setDone((s) => new Set(s).add(n.id)); if (!n.id.startsWith("proposal:")) void ack(n.id); }}
                className={cx("rounded-[9px] px-3 py-[6px] text-[10px] font-black whitespace-nowrap", TONE[n.action.tone])}>{n.action.label}</Link>
            </div>
          ))}
        </div>
      ) : <div className="rounded-[15px] bg-card border border-line px-4 py-5 text-center text-[12px] font-extrabold text-ink-3">Nothing needs you right now 🎉</div>}

      <div className="mt-[13px] mb-[6px] text-[11px] font-black text-ink-3">UPDATES</div>
      <div>
        {!items.length && <p className="py-6 text-center text-[11.5px] font-bold text-ink-3">No notifications yet — replies, votes, lessons and club news land here.</p>}
        {items.map((n, i) => {
          const icon = TYPE_ICON[n.type] ?? KIND_ICON[n.kind] ?? KIND_ICON.system;
          return (
            <Link key={n.id} href={n.href} onClick={() => void ack(n.id)}
              className={cx("flex items-center gap-[9px] py-2", i < items.length - 1 && "border-b border-[#F1E8D4]", isRead(n) && "opacity-70")}>
              {n.actorName
                ? <RingAvatar initial={n.actorName.charAt(0).toUpperCase()} bg="bg-green-3" ring={null} size={26} />
                : <span className="flex items-center justify-center shrink-0" style={{ width: 26, height: 26, borderRadius: 9, background: icon.tint, fontSize: 12 }} aria-hidden>{icon.emoji}</span>}
              <span className="flex-1 min-w-0">
                <span className="block text-[11.5px] font-bold text-ink-2 truncate">{n.actorName && <b className="text-ink">{n.actorName} </b>}<CashText text={n.title} /></span>
                {n.body && <span className="block text-[10px] font-bold text-ink-3 truncate"><CashText text={n.body} /></span>}
              </span>
              {!isRead(n) && <span className="w-[7px] h-[7px] rounded-full bg-orange shrink-0" aria-label="unread" />}
              <span className="text-[9px] font-extrabold text-ink-4 whitespace-nowrap">{n.ago}</span>
            </Link>
          );
        })}
      </div>
      <p className="mt-[9px] text-center text-[10px] font-bold text-ink-4">Every tap lands on the pick, vote, thread or lesson — never a generic page</p>
    </div>
  );
}
