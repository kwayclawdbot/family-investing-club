"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cx } from "@/components/ui";
import { ChevronLeft } from "@/components/ui/icons";
import { RingAvatar } from "@/components/community/BarChip";
import { needsYou as NY, updates as UP, type NeedsYou, type Update } from "@/lib/fixtures/v12-social";

const TONE = { purple: "bg-purple text-cream-text", green: "bg-green-tint text-green", orange: "bg-orange text-cream-text" };
function Icon({ icon, size }: { icon: NeedsYou["icon"] | Update["icon"]; size: number }) {
  if (icon.avatar) return <RingAvatar initial={icon.avatar.initial} bg={icon.avatar.bg} ring={icon.avatar.belt} size={size} />;
  return <span className="flex items-center justify-center shrink-0" style={{ width: size, height: size, borderRadius: size > 30 ? 11 : 9, background: icon.tint, fontSize: size > 30 ? 15 : 12 }} aria-hidden>{icon.emoji}</span>;
}

/** Notifications (canvas v12, board 11): Needs You first, one action each; updates deep-link — never a generic page. */
export function NotificationsV4() {
  const [done, setDone] = useState<string[]>([]);
  const [read, setRead] = useState(false);
  useEffect(() => { try { setDone(JSON.parse(localStorage.getItem("fic.needsyou.done") || "[]")); setRead(localStorage.getItem("fic.notif.readall") === "1"); } catch { /* ignore */ } }, []); // eslint-disable-line react-hooks/set-state-in-effect -- hydrate after mount
  const act = (id: string) => { const n = [...done, id]; setDone(n); try { localStorage.setItem("fic.needsyou.done", JSON.stringify(n)); } catch { /* ignore */ } };
  const open = NY.filter((n) => !done.includes(n.id));
  return (
    <div className="pt-[14px] pb-6">
      <div className="flex items-center gap-3">
        <Link href="/home" aria-label="Back" className="text-ink-2"><ChevronLeft size={20} /></Link>
        <span className="text-[16px] font-black text-ink">Notifications</span>
        <button type="button" onClick={() => { setRead(true); try { localStorage.setItem("fic.notif.readall", "1"); } catch { /* ignore */ } }} className="ml-auto text-[10.5px] font-extrabold text-green">Mark all read</button>
      </div>
      <div className="mt-[13px] mb-[6px] text-[11px] font-black text-orange-2">NEEDS YOU · {open.length}</div>
      {open.length ? (
        <div className="bg-card border border-line rounded-[15px] px-[14px] py-[3px]">
          {open.map((n, i) => (
            <div key={n.id} className={cx("flex items-center gap-[11px] py-[11px]", i < open.length - 1 && "border-b border-paper-2")}>
              <Icon icon={n.icon} size={34} />
              <div className="flex-1 min-w-0"><div className="text-[12.5px] font-extrabold text-ink">{n.title}</div><div className="text-[10px] font-bold text-ink-3">{n.sub}</div></div>
              <Link href={n.action.href} onClick={() => act(n.id)} className={cx("rounded-[9px] px-3 py-[6px] text-[10px] font-black whitespace-nowrap", TONE[n.action.tone])}>{n.action.label}</Link>
            </div>
          ))}
        </div>
      ) : <div className="rounded-[15px] bg-card border border-line px-4 py-5 text-center text-[12px] font-extrabold text-ink-3">Nothing needs you right now 🎉</div>}
      <div className="mt-[13px] mb-[6px] text-[11px] font-black text-ink-3">UPDATES</div>
      <div>
        {UP.map((u, i) => (
          <Link key={u.id} href={u.href} className={cx("flex items-center gap-[9px] py-2", i < UP.length - 1 && "border-b border-[#F1E8D4]", read && "opacity-70")}>
            <Icon icon={u.icon} size={26} />
            <span className="flex-1 text-[11.5px] font-bold text-ink-2">{u.who && <b className="text-ink">{u.who}</b>}{u.text}</span>
            <span className="text-[9px] font-extrabold text-ink-4">{u.ago}</span>
          </Link>
        ))}
      </div>
      <p className="mt-[9px] text-center text-[10px] font-bold text-ink-4">Every tap lands directly on the pick, vote, thread or research — never a generic page</p>
    </div>
  );
}
