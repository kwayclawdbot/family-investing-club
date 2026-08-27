"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Notification } from "@/lib/types";
import { cx } from "@/components/ui";
import { EmptyState } from "@/components/ui/extras";
import { useLocal } from "./useLocal";

const ICON: Record<Notification["kind"], string> = { lesson: "📘", family: "👨‍👩‍👧‍👦", club: "💬", live: "🔴", system: "⚙️" };
const FILTERS = [["all", "All"], ["family", "Family"], ["club", "Club"], ["live", "Live"], ["lesson", "Lessons"]] as const;

export function Inbox({ items }: { items: Notification[] }) {
  const router = useRouter();
  const [read, setRead] = useLocal<string[]>("fic.read", items.filter((n) => n.read).map((n) => n.id));
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const list = items.filter((n) => filter === "all" || n.kind === filter);
  const isToday = (ago: string) => /ago$/.test(ago) && !/d ago$/.test(ago);
  const groups = [["Today", list.filter((n) => isToday(n.ago))], ["Earlier", list.filter((n) => !isToday(n.ago))]] as const;
  const unread = items.filter((n) => !read.includes(n.id)).length;

  function open(n: Notification) {
    setRead((r) => (r.includes(n.id) ? r : [...r, n.id]));
    router.push(n.href);
  }

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-bold text-ink-3">{unread ? `${unread} unread` : "All caught up"}</span>
        <button onClick={() => setRead(items.map((n) => n.id))} className="text-[12px] font-extrabold text-green">Mark all read</button>
      </div>
      <div className="mt-3 flex gap-[6px] overflow-x-auto no-scrollbar" role="tablist">
        {FILTERS.map(([v, l]) => (
          <button key={v} role="tab" aria-selected={filter === v} onClick={() => setFilter(v)}
            className={cx("h-[30px] px-[13px] rounded-[10px] text-[12px] font-extrabold shrink-0", filter === v ? "bg-green text-cream-text" : "bg-card border border-line text-ink-3")}>{l}</button>
        ))}
      </div>
      {list.length === 0 && <div className="mt-3"><EmptyState emoji="🔔" title="Nothing here yet" body="Notifications about your family, Club and lessons show up here." /></div>}
      {groups.map(([label, arr]) => arr.length > 0 && (
        <div key={label}>
          <h2 className="mt-4 mb-2 text-[11px] font-black text-ink-3 tracking-[0.6px] uppercase">{label}</h2>
          <div className="bg-card border border-line rounded-card px-4 py-1">
            {arr.map((n, i) => {
              const unreadItem = !read.includes(n.id);
              return (
                <button key={n.id} onClick={() => open(n)} className={cx("w-full flex items-start gap-3 py-3 text-left", i < arr.length - 1 && "border-b border-paper-2")}>
                  <span className="w-9 h-9 rounded-[10px] bg-paper-2 flex items-center justify-center text-[16px] shrink-0">{ICON[n.kind]}</span>
                  <span className="flex-1 min-w-0">
                    <span className={cx("block text-[13.5px] leading-[1.3]", unreadItem ? "font-black text-ink" : "font-extrabold text-ink-2")}>{n.title}</span>
                    <span className="block text-[12px] font-bold text-ink-3 truncate">{n.body}</span>
                    <span className="block text-[10.5px] font-extrabold text-ink-4 mt-[2px]">{n.ago}</span>
                  </span>
                  {unreadItem && <span className="w-2 h-2 rounded-full bg-orange mt-2 shrink-0" aria-label="Unread" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
