"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClub, getCompanies } from "@/lib/data";
import type { Club, Company } from "@/lib/types";
import { cx } from "@/components/ui";
import { SearchIcon } from "@/components/ui/icons";
import { Eyebrow, Raised, TickerTile } from "@/components/club/club-shared";
import { read, write, newId } from "@/components/club/storage";
import { clubApi, signedOut } from "@/lib/live/client-club";
import { SheetFrame } from "./SheetFrame";
import { showXp } from "./bus";

type Ask = { id: string; text: string; symbol?: string; at: string; author: string };

/** "Ask the club" — a question to your private circle, optionally pinned to a company.
 *  Signed in → POST /api/club/ask (fic_club_asks). Signed out (401) → the local demo path. */
export function AskClubSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [club, setClub] = useState<Club | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [text, setText] = useState("");
  const [symbol, setSymbol] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([clubApi.context(), getCompanies(), getClub()]).then(([ctx, cs, fx]) => { setClub(ctx.ok && ctx.club ? ctx.club : fx); setCompanies(cs); });
  }, []);
  const results = companies.filter((c) => !query || c.symbol.toLowerCase().includes(query.toLowerCase()) || c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6);

  async function post() {
    if (busy) return;
    setBusy(true); setError(null);
    const r = await clubApi.ask(text.trim(), symbol ?? undefined);
    setBusy(false);
    if (r.ok) { setDone(true); if (r.xp) showXp(r.xp); router.refresh(); return; }
    if (signedOut(r)) {
      const ask: Ask = { id: newId(), text: text.trim(), symbol: symbol ?? undefined, at: new Date().toISOString(), author: "Kway" };
      write("fic.asks", [ask, ...read<Ask[]>("fic.asks", [])]);
      setDone(true); showXp(5); return;
    }
    setError(r.error);
  }

  return (
    <SheetFrame title="Ask the club" onClose={onClose} height="auto">
      {done ? (
        <div className="py-8 text-center">
          <div className="text-[34px]" aria-hidden>💬</div>
          <div className="mt-2 text-[16px] font-black text-ink">Posted to {club?.shortName ?? "your club"}</div>
          <p className="mt-1 text-[12.5px] font-bold text-ink-3">Your club sees it in the private chat. Replies land there too.</p>
          <Raised tone="green" className="mt-5" onClick={onClose}>Done</Raised>
        </div>
      ) : (
        <>
          <p className="mt-2 text-[12.5px] font-bold text-ink-3">Only {club?.shortName ?? "your club"} sees this. No question is too basic.</p>
          <textarea autoFocus value={text} onChange={(e) => setText(e.target.value.slice(0, 280))} placeholder="Is Costco too expensive right now? What should I look at first?" rows={3} className="mt-3 w-full bg-card border-[1.5px] border-line rounded-[14px] px-[15px] py-[13px] text-[14px] font-semibold text-ink leading-[1.5] outline-none focus:border-purple placeholder:text-ink-4 resize-none" />
          <Eyebrow className="mt-3">ABOUT A COMPANY · OPTIONAL</Eyebrow>
          {symbol && !picking ? (
            <div className="mt-[7px] flex items-center gap-[10px] bg-card border border-line rounded-[14px] px-3 py-2">
              <TickerTile symbol={symbol} size={28} />
              <span className="flex-1 text-[12.5px] font-extrabold text-ink">{companies.find((c) => c.symbol === symbol)?.name ?? symbol}</span>
              <button onClick={() => setSymbol(null)} className="text-[11px] font-extrabold text-purple-2">Remove</button>
            </div>
          ) : (
            <div className="mt-[7px] bg-card border border-line rounded-[14px] px-3 py-2">
              <div className="flex items-center gap-2">
                <SearchIcon className="text-ink-4" />
                <input value={query} onFocus={() => setPicking(true)} onChange={(e) => setQuery(e.target.value)} placeholder="Search companies, ETFs…" className="flex-1 bg-transparent text-[13px] font-bold text-ink outline-none placeholder:text-ink-4" />
              </div>
              {picking && (
                <div className="mt-1 max-h-[140px] overflow-y-auto no-scrollbar">
                  {results.map((c) => (
                    <button key={c.symbol} onClick={() => { setSymbol(c.symbol); setPicking(false); setQuery(""); }} className="w-full flex items-center gap-[10px] py-2 border-t border-paper-2 text-left">
                      <TickerTile symbol={c.symbol} size={26} />
                      <span className="flex-1 text-[12.5px] font-extrabold text-ink">{c.name}</span>
                      <span className="text-[11px] font-bold text-ink-3">{c.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {error && <p role="alert" className="mt-3 rounded-[12px] bg-orange-tint border border-orange-line px-3 py-2 text-[12px] font-bold text-orange-2">{error}</p>}
          <div className="pt-4 pb-[calc(8px+env(safe-area-inset-bottom))]">
            <Raised tone="purple" onClick={post} disabled={busy || text.trim().length < 6} className={cx(text.trim().length < 6 && "opacity-60")}>{busy ? "Posting…" : "Post to the club"}</Raised>
          </div>
        </>
      )}
    </SheetFrame>
  );
}
