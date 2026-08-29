"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Club, ClubProposal, ResearchAssignment } from "@/lib/types";
import { cx } from "@/components/ui";
import { Sheet } from "@/components/ui/extras";
import { ChevronRight } from "@/components/ui/icons";
import { MemberAvatar, TickerTile } from "./club-shared";
import { useStored } from "./storage";

/* ── Research tab — collaborative list with reasons + assignees ────── */
export function ResearchList({ research, club }: { research: ResearchAssignment[]; club: Club }) {
  const [overrides, setOverrides] = useStored<Record<string, Partial<ResearchAssignment>>>("fic.research", {});
  const [assign, setAssign] = useState<ResearchAssignment | null>(null);
  const items = useMemo(() => research.map((r) => ({ ...r, ...overrides[r.id] })), [research, overrides]);
  const openItems = items.filter((r) => r.status === "open");
  const doneItems = items.filter((r) => r.status === "done");
  return (
    <div className="mb-24">
      <div className="flex items-center justify-between mt-3">
        <div className="text-[11px] font-black text-ink-3">RESEARCHING TOGETHER · {openItems.length} OPEN</div>
        <Link href="/search" className="text-[11px] font-black text-green">+ Add a company</Link>
      </div>
      <div className="mt-2 bg-card border border-line rounded-[16px] px-[15px] py-1">
        {openItems.map((r, i) => (
          <div key={r.id} className={cx("flex items-center gap-[10px] py-[10px]", i < openItems.length - 1 && "border-b border-paper-2")}>
            <TickerTile symbol={r.symbol} />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-extrabold text-ink">{r.name} <span className="text-ink-3 font-bold">· {r.assignee === "you" ? "you" : r.assignee}</span></div>
              <div className="text-[10.5px] font-bold text-ink-3 truncate">&quot;{r.reason}&quot; · due {r.due}</div>
            </div>
            {r.assignee === "you" ? (
              <Link href={`/discover/${r.symbol}`} className="text-[10.5px] font-black text-green whitespace-nowrap">Research ›</Link>
            ) : (
              <button onClick={() => setAssign(r)} className="text-[10.5px] font-black text-purple-2 whitespace-nowrap">Assign</button>
            )}
          </div>
        ))}
        {openItems.length === 0 && <div className="py-6 text-center text-[12.5px] font-bold text-ink-3">Nothing open — add a company you all know.</div>}
      </div>
      {doneItems.length > 0 && (
        <>
          <div className="mt-4 text-[11px] font-black text-ink-3">DONE · NOTES</div>
          <div className="mt-2 bg-card border border-line rounded-[16px] px-[15px] py-1">
            {doneItems.map((r, i) => (
              <div key={r.id} className={cx("py-[10px]", i < doneItems.length - 1 && "border-b border-paper-2")}>
                <div className="flex items-center gap-[10px]">
                  <TickerTile symbol={r.symbol} />
                  <div className="flex-1 text-[12.5px] font-extrabold text-ink">{r.name} <span className="text-ink-3 font-bold">· {r.assignee} · done</span></div>
                  <span className="text-green-2 font-black">✓</span>
                </div>
                {r.notes && <div className="mt-[6px] ml-[42px] text-[11.5px] font-bold text-ink-2">&quot;{r.notes}&quot;</div>}
                <Link href="/club/new?from=research" className="ml-[42px] mt-1 inline-block text-[10.5px] font-extrabold text-purple-2">Turn into an Idea →</Link>
              </div>
            ))}
          </div>
        </>
      )}
      <Sheet open={!!assign} onClose={() => setAssign(null)} title={assign ? `Who researches ${assign.symbol}?` : ""}>
        <div className="flex flex-col gap-2">
          {club.members.filter((m) => m.id !== "dad").map((m) => (
            <button key={m.id} onClick={() => { if (assign) setOverrides({ ...overrides, [assign.id]: { assigneeId: m.id, assignee: m.isYou ? "you" : m.name } }); setAssign(null); }} className="flex items-center gap-3 bg-paper border border-line rounded-[12px] px-3 py-[10px] text-left">
              <MemberAvatar m={m} size={28} />
              <span className="flex-1 text-[13px] font-extrabold text-ink">{m.isYou ? "Me — I volunteer" : m.name}</span>
              <ChevronRight className="text-ink-4" />
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

/* ── Members tab ───────────────────────────────────────────────────── */
/* helpers */
export function proposalTitle(p: ClubProposal) {
  const delta = p.toWeightPct - p.fromWeightPct;
  if (p.kind === "remove") return `Remove ${p.symbol}`;
  if (p.kind === "add" && p.fromWeightPct === 0) return `Add ${p.symbol} ${p.toWeightPct}%`;
  return `${delta >= 0 ? "Add" : "Trim"} ${p.symbol} ${delta >= 0 ? "+" : ""}${delta}%`;
}
export function tally(p: ClubProposal) {
  return `${p.votes.filter((v) => v.vote).length}/${p.votes.length}`;
}
export function avatarFor(club: Club, id: string, name: string) {
  return club.members.find((m) => m.id === id) ?? { initial: name.charAt(0).toUpperCase(), color: "bg-purple" };
}
