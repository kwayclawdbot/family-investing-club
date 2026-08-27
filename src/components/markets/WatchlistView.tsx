"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Company, WatchItem } from "@/lib/types";
import { Card, Segmented, Tag } from "@/components/ui";
import { EmptyState, Sheet } from "@/components/ui/extras";
import { MoreIcon } from "@/components/ui/icons";
import { SymbolTile } from "./SymbolTile";
import { money, pct } from "./format";
import { readWatch, mergeWatch, removeWatch, type WatchState } from "./store";

const LISTS = ["Personal", "Family", "Class"] as const;

export function WatchlistView({ base, companies }: { base: WatchItem[]; companies: Company[] }) {
  const [tab, setTab] = useState<(typeof LISTS)[number]>("Personal");
  const [state, setState] = useState<WatchState>({ added: [], removed: [] });
  const [menu, setMenu] = useState<WatchItem | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setState(readWatch());
  }, []);

  const items = mergeWatch(base, state).filter((w) => w.list === tab.toLowerCase());
  const byId = Object.fromEntries(companies.map((c) => [c.symbol, c]));

  return (
    <>
      <Segmented items={[...LISTS]} value={tab} onChange={(v) => setTab(v as (typeof LISTS)[number])} className="mt-3" />
      {tab === "Class" ? (
        <div className="mt-3">
          <EmptyState emoji="🏫" title="Join a class to see its research list" body="Class lists turn into research assignments from your teacher." action="Browse groups" href="/club/groups" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-3">
          <EmptyState emoji="👀" title={tab === "Family" ? "No family picks yet" : "Your watchlist is empty"} body="Save companies you're curious about and write down why." action="Add a company" href="/search" />
        </div>
      ) : (
        <Card className="mt-3 !py-1 !px-4">
          {items.map((w, i) => {
            const c = byId[w.symbol];
            return (
              <div key={w.symbol + w.list} className={`flex items-start gap-[11px] py-[11px] ${i < items.length - 1 ? "border-b border-paper-2" : ""}`}>
                <Link href={`/markets/${w.symbol}`} className="flex flex-1 min-w-0 items-start gap-[11px]">
                  <SymbolTile symbol={w.symbol} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] font-extrabold text-ink truncate">{w.name}</span>
                    <span className="block text-[11.5px] font-bold text-ink-3 leading-[1.4]">{w.reason}</span>
                    {w.ideaId && (
                      <Tag tone="purple" className="mt-[5px]">💡 Club idea</Tag>
                    )}
                  </span>
                  {c ? (
                    <span className="text-right shrink-0">
                      <span className="block text-[13.5px] font-black text-ink">${money(c.price)}</span>
                      <span className={`block text-[11px] font-extrabold ${c.changePct >= 0 ? "text-[#3A8C4A]" : "text-red"}`}>{pct(c.changePct, 2)}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-ink-4 shrink-0">no quote</span>
                  )}
                </Link>
                <button type="button" aria-label={`More for ${w.symbol}`} onClick={() => setMenu(w)} className="w-7 h-7 -mr-2 rounded-full flex items-center justify-center text-ink-4">
                  <MoreIcon size={16} />
                </button>
              </div>
            );
          })}
        </Card>
      )}

      <Link href="/search" className="mt-3 flex h-[50px] items-center justify-center rounded-[16px] border border-dashed border-green-line bg-green-tint text-[14px] font-black text-green">
        ＋ Add a company
      </Link>

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu?.symbol}>
        {menu && (
          <div className="flex flex-col gap-2">
            <Link href={`/markets/${menu.symbol}`} className="h-[46px] rounded-[14px] bg-paper-2 flex items-center px-4 text-[13.5px] font-extrabold text-ink">Open company page</Link>
            <Link href={`/practice/trade/${menu.symbol}`} className="h-[46px] rounded-[14px] bg-paper-2 flex items-center px-4 text-[13.5px] font-extrabold text-ink">Practice buy</Link>
            <button
              type="button"
              onClick={() => { setState(removeWatch(menu.symbol, menu.list)); setMenu(null); }}
              className="h-[46px] rounded-[14px] bg-[#FBEAE6] flex items-center px-4 text-[13.5px] font-extrabold text-red"
            >
              Remove from {menu.list} list
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}
