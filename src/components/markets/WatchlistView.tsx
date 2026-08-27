"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Company, WatchItem, ResearchAssignment, ClubMember } from "@/lib/types";
import { EmptyState, Sheet } from "@/components/ui/extras";
import { MoreIcon } from "@/components/ui/icons";
import { SymbolTile } from "./SymbolTile";
import { money, pct } from "./format";
import { readWatch, mergeWatch, removeWatch, type WatchState } from "./store";
import { EXTRA, ADDED_BY, ADDED_REASON } from "./companies-extra";

type Tab = "My List" | "Club" | "Class";
type Row = WatchItem & { addedBy: string; researcher?: ResearchAssignment };

/** Local overrides for research assignments (`fic.research`): symbol → assignee name. */
function readAssign(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem("fic.research") ?? "{}"); } catch { return {}; }
}
function writeAssign(v: Record<string, string>) {
  try { localStorage.setItem("fic.research", JSON.stringify(v)); } catch { /* storage unavailable */ }
}

/** Artboard 25 — research lists with a "why": who added it, who's researching it, assign / volunteer. */
export function WatchlistView({ base, companies, research, members, clubName, you }: { base: WatchItem[]; companies: Company[]; research: ResearchAssignment[]; members: ClubMember[]; clubName: string; you: string }) {
  const [tab, setTab] = useState<Tab>("Club");
  const [state, setState] = useState<WatchState>({ added: [], removed: [] });
  const [assign, setAssign] = useState<Record<string, string>>({});
  const [menu, setMenu] = useState<Row | null>(null);
  const [assigning, setAssigning] = useState<Row | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setState(readWatch());
    setAssign(readAssign());
  }, []);

  const byId = Object.fromEntries([...companies, ...Object.values(EXTRA)].map((c) => [c.symbol, c]));
  const merged = mergeWatch(base, state);
  const personal = merged.filter((w) => w.list === "personal");
  // The club list = the shared "family" list plus every company someone in the club is researching.
  const clubBase = merged.filter((w) => w.list === "family");
  const fromResearch: WatchItem[] = research
    .filter((r) => !clubBase.some((w) => w.symbol === r.symbol) && !state.removed.includes(r.symbol))
    .filter((r, i, arr) => arr.findIndex((x) => x.symbol === r.symbol) === i)
    .map((r) => ({ symbol: r.symbol, name: r.name, reason: ADDED_REASON[r.symbol] ?? r.reason, list: "family" as const }));
  const clubItems: Row[] = [...clubBase, ...fromResearch].map((w) => {
    const open = research.find((r) => r.symbol === w.symbol && r.status === "open");
    const local = assign[w.symbol];
    const researcher = local ? { ...(open ?? { id: `local-${w.symbol}`, symbol: w.symbol, name: w.name, assigneeId: "", due: "before Family Night", status: "open" as const, reason: w.reason }), assignee: local } : open;
    return { ...w, reason: ADDED_REASON[w.symbol] ?? w.reason, addedBy: ADDED_BY[w.symbol] ?? you, researcher };
  });
  const items: Row[] = tab === "My List" ? personal.map((w) => ({ ...w, addedBy: you })) : tab === "Club" ? clubItems : [];

  const tabs: Tab[] = ["My List", "Club", "Class"];
  const label = (t: Tab) => (t === "Club" ? clubName : t);

  function doAssign(row: Row, who: string) {
    const next = { ...assign, [row.symbol]: who };
    setAssign(next); writeAssign(next); setAssigning(null); setMenu(null);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-[21px] font-black text-ink">Research Lists</h1>
        <Link href="/search" aria-label="Add a company" className="w-[34px] h-[34px] rounded-full bg-green-2 text-white text-[19px] font-extrabold flex items-center justify-center">＋</Link>
      </div>
      <div className="mt-3 flex gap-[7px]" role="tablist">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-[10px] px-[15px] py-[7px] text-[12.5px] ${tab === t ? "bg-green-2 text-cream-text font-black" : "bg-card border border-line text-ink-3 font-extrabold"}`}>{label(t)}</button>
        ))}
      </div>

      {tab === "Class" ? (
        <div className="mt-3"><EmptyState emoji="🏫" title="Join a class to see its research list" body="Class lists turn into research assignments from your teacher." action="Browse groups" href="/club/groups" /></div>
      ) : items.length === 0 ? (
        <div className="mt-3"><EmptyState emoji="🔍" title={tab === "Club" ? "Your club hasn't saved a company yet" : "Your list is empty"} body="Save a company and write down why — that's the whole habit." action="Add a company" href="/search" /></div>
      ) : (
        <div className="mt-3 rounded-card border border-line bg-card px-4 py-3">
          <div className="flex items-center justify-between border-b border-paper-2 pb-2">
            <span className="text-[13px] font-black text-ink">{tab === "Club" ? `${clubName.replace(/^The /, "")} List` : "My List"} · {items.length} {items.length === 1 ? "company" : "companies"}</span>
            <span className="text-[11px] font-extrabold text-ink-3">each has a “why”</span>
          </div>
          {items.map((w, i) => {
            const c = byId[w.symbol];
            return (
              <div key={w.symbol + w.list} className={`flex items-start gap-[11px] py-[11px] ${i < items.length - 1 ? "border-b border-paper-2" : ""}`}>
                <Link href={`/discover/${w.symbol}`} className="flex flex-1 min-w-0 items-start gap-[11px]">
                  <SymbolTile symbol={w.symbol} size={36} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] font-extrabold text-ink truncate">{(c?.name ?? w.name).replace(/ (Inc\.|Co\.|Corp\.|Wholesale|Company)$/, "")}</span>
                    <span className="block text-[11px] font-bold text-ink-3 leading-[1.35]">{w.addedBy}: “{w.reason}”</span>
                    {w.researcher && (
                      <span className="mt-[3px] inline-flex items-center gap-1 rounded-[6px] bg-green-tint px-[6px] py-[1px] text-[10px] font-extrabold text-green">
                        🔍 {w.researcher.assignee === "you" ? "You're" : `${w.researcher.assignee} is`} researching{w.researcher.status === "done" ? " · done" : ` · due ${w.researcher.due}`}
                      </span>
                    )}
                    {w.ideaId && <span className="ml-1 mt-[3px] inline-flex rounded-[6px] bg-purple-tint px-[6px] py-[1px] text-[10px] font-extrabold text-purple-2">💡 Club idea</span>}
                  </span>
                  {c ? (
                    <span className="text-right shrink-0">
                      <span className="block text-[13px] font-black text-ink">${money(c.price)}</span>
                      <span className={`block text-[11px] font-extrabold ${c.changePct >= 0 ? "text-[#3A8C4A]" : "text-red"}`}>{pct(c.changePct)}</span>
                    </span>
                  ) : <span className="text-[11px] font-bold text-ink-4 shrink-0">no quote</span>}
                </Link>
                <button type="button" aria-label={`Actions for ${w.symbol}`} onClick={() => setMenu(w)} className="w-7 h-7 -mr-2 rounded-full flex items-center justify-center text-ink-4"><MoreIcon size={16} /></button>
              </div>
            );
          })}
        </div>
      )}

      {tab === "Club" && (
        <Link href="/club/challenges" className="mt-3 flex items-center gap-3 rounded-card border border-green-line bg-green-tint px-4 py-[13px]">
          <span className="text-[22px]" aria-hidden>🎯</span>
          <span className="flex-1">
            <span className="block text-[13.5px] font-black text-ink">Turn this list into a challenge</span>
            <span className="block text-[11.5px] font-bold text-green">Each member researches one pick before Family Night</span>
          </span>
          <span className="rounded-[11px] bg-green-2 px-[13px] py-[7px] text-[11.5px] font-black text-cream-text">Set up</span>
        </Link>
      )}

      <Link href="/search" className="mt-3 block rounded-[14px] border border-dashed border-[#D9CDB2] bg-card p-3 text-center text-[12.5px] font-extrabold text-ink-3">＋ Add a company with your reason for watching</Link>
      <p className="mt-3 text-center text-[11px] font-bold text-ink-4">Research lists, not trade lists — every pick carries a reason.</p>

      <Sheet open={!!menu && !assigning} onClose={() => setMenu(null)} title={menu?.symbol}>
        {menu && (
          <div className="flex flex-col gap-2">
            <Link href={`/club/pick/new?symbol=${menu.symbol}`} className="h-[46px] rounded-[14px] bg-green-tint flex items-center px-4 text-[13.5px] font-extrabold text-green">▲ Make a Pick</Link>
            {tab === "Club" && <button type="button" onClick={() => setAssigning(menu)} className="h-[46px] rounded-[14px] bg-paper-2 flex items-center px-4 text-[13.5px] font-extrabold text-ink text-left">🔍 Assign research</button>}
            {tab === "Club" && <button type="button" onClick={() => doAssign(menu, "you")} className="h-[46px] rounded-[14px] bg-paper-2 flex items-center px-4 text-[13.5px] font-extrabold text-ink text-left">🙋 Volunteer to research</button>}
            <Link href={`/discover/${menu.symbol}`} className="h-[46px] rounded-[14px] bg-paper-2 flex items-center px-4 text-[13.5px] font-extrabold text-ink">Open company page</Link>
            <Link href={`/practice/trade/${menu.symbol}`} className="h-[46px] rounded-[14px] bg-paper-2 flex items-center px-4 text-[13.5px] font-extrabold text-ink">Practice buy</Link>
            <button type="button" onClick={() => { setState(removeWatch(menu.symbol, menu.list)); setMenu(null); }} className="h-[46px] rounded-[14px] bg-[#FBEAE6] flex items-center px-4 text-[13.5px] font-extrabold text-red">Remove from list</button>
          </div>
        )}
      </Sheet>
      <Sheet open={!!assigning} onClose={() => setAssigning(null)} title={`Who researches ${assigning?.symbol}?`}>
        {assigning && (
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <button key={m.id} type="button" onClick={() => doAssign(assigning, m.isYou ? "you" : m.name)} className="h-[46px] rounded-[14px] bg-paper-2 flex items-center gap-3 px-4 text-[13.5px] font-extrabold text-ink text-left">
                <span className={`w-7 h-7 rounded-full ${m.color} text-white text-[11px] font-black flex items-center justify-center`}>{m.initial}</span>
                {m.name}{m.isYou ? " (you)" : ""}{m.role === "child" ? " · 🎓" : ""}
              </button>
            ))}
            <p className="text-[11px] font-bold text-ink-4 text-center">Due before Family Night · everyone sees who&apos;s on it</p>
          </div>
        )}
      </Sheet>
    </>
  );
}
