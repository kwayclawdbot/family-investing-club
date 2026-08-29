"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, cx } from "@/components/ui";
import { EmptyState, Sheet } from "@/components/ui/extras";
import { familyApi } from "@/lib/live/client-family";
import type { FamilyWatchlist } from "@/lib/live/family";

const field = "w-full h-[44px] rounded-[12px] border border-line bg-paper px-3 text-[14px] font-bold text-ink placeholder:text-ink-4 outline-none focus:border-green";

/** The family research list (FTA `family_watchlist`) with tonight's vote (`family_watchlist_votes`). */
export function WatchlistManager({ list, me, isParent }: { list: FamilyWatchlist; me: string; isParent: boolean }) {
  const router = useRouter();
  const [add, setAdd] = useState(false);
  const [symbol, setSymbol] = useState(""); const [name, setName] = useState(""); const [why, setWhy] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const say = (m: string) => { setToast(m); setTimeout(() => setToast(null), 1800); };

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy("add"); setErr(null);
    const r = await familyApi.addCompany({ symbol, companyName: name || undefined, why: why || undefined });
    setBusy(null);
    if (!r.ok) { setErr(r.error); return; }
    setAdd(false); setSymbol(""); setName(""); setWhy("");
    say(r.updated ? "Updated" : "Added to the family list");
    router.refresh();
  }
  async function vote(ticker: string) {
    setBusy(ticker); setErr(null);
    const r = list.myVote === ticker ? await familyApi.clearVote() : await familyApi.vote(ticker);
    setBusy(null);
    if (!r.ok) { setErr(r.error); return; }
    say(list.myVote === ticker ? "Vote cleared" : "xp" in r && r.xp ? `Voted · +${r.xp} XP` : "Voted");
    router.refresh();
  }
  async function remove(id: string) {
    setBusy(id); setErr(null);
    const r = await familyApi.removeCompany(id);
    setBusy(null);
    if (!r.ok) { setErr(r.error); return; }
    router.refresh();
  }

  return (
    <div className="pb-6">
      <p className="text-[12.5px] font-bold text-ink-3">Companies the family is learning about — each one has a reason. Tap a company to vote for tonight.</p>
      {list.entries.length === 0 ? (
        <div className="mt-3"><EmptyState emoji="🔎" title="No companies yet" body="Add a brand you all use and say why it caught your eye." /></div>
      ) : (
        <div className="mt-3 bg-card border border-line rounded-card px-4 py-1">
          {list.entries.map((r, i) => {
            const mine = list.myVote === r.ticker;
            return (
              <div key={r.id} className={cx("py-3", i < list.entries.length - 1 && "border-b border-paper-2")}>
                <div className="flex items-center gap-3">
                  <Link href={`/discover/${r.ticker}`} className="w-10 h-10 rounded-[10px] bg-green-tint text-green text-[11px] font-black flex items-center justify-center">{r.ticker}</Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/discover/${r.ticker}`} className="block text-[13.5px] font-black text-ink truncate">{r.name}</Link>
                    <div className="text-[11.5px] font-bold text-ink-3 truncate">{r.why || `${r.champion} added it`}{r.status === "study" ? " · studying" : ""}</div>
                  </div>
                  <button type="button" onClick={() => vote(r.ticker)} disabled={busy !== null} aria-pressed={mine}
                    className={cx("h-[30px] px-3 rounded-[10px] text-[11.5px] font-extrabold whitespace-nowrap", mine ? "bg-purple-2 text-cream-text" : "bg-purple-tint text-purple-2")}>
                    {mine ? "Voted ✓" : "Vote"}{r.votes ? ` · ${r.votes}` : ""}
                  </button>
                </div>
                {(r.voters.length > 0 || isParent || r.championId === me) && (
                  <div className="mt-[6px] flex items-center gap-2 text-[10.5px] font-bold text-ink-4">
                    <span className="flex-1 truncate">{r.voters.length ? `Tonight: ${r.voters.join(", ")}` : "No votes yet tonight"}</span>
                    {(isParent || r.championId === me) && <button type="button" onClick={() => remove(r.id)} disabled={busy !== null} className="text-red font-extrabold">Remove</button>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {err && <p className="mt-2 text-[12px] font-bold text-red" role="alert">{err}</p>}
      {toast && <div className="mt-3 text-center text-[12px] font-extrabold text-green" role="status">{toast} ✓</div>}
      <Button size="md" variant="secondary" full className="mt-3" onClick={() => setAdd(true)}>＋ Add a company</Button>
      {list.leader && <p className="mt-3 text-center text-[12px] font-bold text-ink-3">Leading tonight: <b className="text-ink">{list.leader.ticker}</b> · <Link href="/family/night" className="text-purple-2 font-extrabold">Run Family Investing Night ›</Link></p>}

      <Sheet open={add} onClose={() => setAdd(false)} title="Add a company">
        <form onSubmit={submitAdd} className="flex flex-col gap-3">
          <div><label className="text-[11px] font-extrabold text-ink-3">Ticker</label><input className={cx(field, "mt-1 uppercase")} value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="KO" maxLength={10} required aria-label="Ticker" /></div>
          <div><label className="text-[11px] font-extrabold text-ink-3">Company (optional)</label><input className={cx(field, "mt-1")} value={name} onChange={(e) => setName(e.target.value)} placeholder="Coca-Cola" maxLength={120} aria-label="Company name" /></div>
          <div><label className="text-[11px] font-extrabold text-ink-3">Why this one?</label><input className={cx(field, "mt-1")} value={why} onChange={(e) => setWhy(e.target.value)} placeholder="We drink it every weekend" maxLength={200} aria-label="Why" /></div>
          {err && <p className="text-[12px] font-bold text-red">{err}</p>}
          <Button type="submit" size="md" variant="green" full disabled={busy === "add" || !symbol}>{busy === "add" ? "Adding…" : "Add to the family list"}</Button>
        </form>
      </Sheet>
    </div>
  );
}
