"use client";
import Link from "next/link";
import { useState } from "react";
import type { FamilyLearner, WatchItem } from "@/lib/types";
import { Avatar, ButtonLink, cx } from "@/components/ui";
import { Sheet, EmptyState } from "@/components/ui/extras";
import { useLocal } from "@/components/profile/useLocal";

export function ResearchList({ items, learners }: { items: WatchItem[]; learners: FamilyLearner[] }) {
  const [extra] = useLocal<WatchItem[]>("fic.research.family", []);
  const [assignFor, setAssignFor] = useState<WatchItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const all = [...items, ...extra];

  function assign(l: FamilyLearner) {
    if (!assignFor) return;
    const key = `fic.tasks.${l.id}`;
    try {
      const cur = JSON.parse(localStorage.getItem(key) ?? "null") ?? l.tasks;
      const title = `Research ${assignFor.symbol}: how does it make money?`;
      if (!cur.some((t: { title: string }) => t.title === title)) localStorage.setItem(key, JSON.stringify([...cur, { title, done: false }]));
    } catch { /* ignore */ }
    setToast(`Assigned to ${l.name}`); setAssignFor(null);
    setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="pb-6">
      <p className="text-[12.5px] font-bold text-ink-3">Companies the family is researching — each one has a reason.</p>
      {all.length === 0 ? (
        <div className="mt-3"><EmptyState emoji="🔎" title="No companies yet" body="Add a brand you all use and give it a reason." action="Add a company" href="/search" /></div>
      ) : (
        <div className="mt-3 bg-card border border-line rounded-card px-4 py-1">
          {all.map((r, i) => (
            <div key={r.symbol} className={cx("py-3", i < all.length - 1 && "border-b border-paper-2")}>
              <div className="flex items-center gap-3">
                <Link href={`/markets/${r.symbol}`} className="w-10 h-10 rounded-[10px] bg-green-tint text-green text-[11px] font-black flex items-center justify-center">{r.symbol}</Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/markets/${r.symbol}`} className="block text-[13.5px] font-black text-ink truncate">{r.name}</Link>
                  <div className="text-[11.5px] font-bold text-ink-3">{r.reason}</div>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => setAssignFor(r)} className="h-[30px] px-3 rounded-[10px] bg-green-tint text-green text-[11.5px] font-extrabold">Assign as research task</button>
                {r.ideaId && <Link href={`/club/idea/${r.ideaId}`} className="h-[30px] px-3 rounded-[10px] bg-purple-tint text-purple-2 text-[11.5px] font-extrabold flex items-center">From a Club idea</Link>}
              </div>
            </div>
          ))}
        </div>
      )}
      <ButtonLink href="/search" size="md" variant="secondary" full className="mt-3">＋ Add a company</ButtonLink>
      {toast && <div className="mt-3 text-center text-[12px] font-extrabold text-green">{toast} ✓</div>}

      <Sheet open={!!assignFor} onClose={() => setAssignFor(null)} title={assignFor ? `Assign ${assignFor.symbol} to…` : ""}>
        <div className="flex flex-col gap-2">
          {learners.map((l) => (
            <button key={l.id} onClick={() => assign(l)} className="flex items-center gap-3 rounded-[12px] border border-line bg-paper px-3 py-[10px] text-left">
              <Avatar name={l.name} color={l.color} size={32} />
              <span className="flex-1">
                <span className="block text-[13.5px] font-black text-ink">{l.name}</span>
                <span className="block text-[11px] font-bold text-ink-3">{l.level} · {l.pathTitle}</span>
              </span>
              <span className="text-green font-black">›</span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
