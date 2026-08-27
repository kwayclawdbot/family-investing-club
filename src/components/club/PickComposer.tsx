"use client";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConnectPromptSheet } from "@/components/verify/ConnectPromptSheet";
import { BROKERAGE_KEY, PROMPTED_KEY, readJSON } from "@/components/verify/storage";
import type { Club, Company, Pick, PickStance } from "@/lib/types";
import { cx } from "@/components/ui";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import { Eyebrow, Raised, TickerTile } from "./club-shared";
import { newId, read, write } from "./storage";

type Quote = { symbol: string; name: string; price: number; changePct: number };
const HORIZONS: Pick["horizon"][] = ["1y", "3y", "5y+"];
const MAX = 140;

/** Artboard 13 — bottom-sheet composer over a dimmed backdrop: fast, honest, timestamped. */
type Props = { club: Club; companies: Company[]; costco: Quote; initialSymbol?: string; /** render inside a host sheet: no backdrop/chrome, call onDone instead of routing */ embedded?: boolean; onDone?: (shared: boolean) => void };

export function PickComposer(props: Props) {
  return (
    <Suspense fallback={null}>
      <PickComposerInner {...props} />
    </Suspense>
  );
}

function PickComposerInner({ club, companies, costco, initialSymbol, embedded, onDone }: Props) {
  const router = useRouter();
  const universe = useMemo<Quote[]>(() => [costco, ...companies.map((c) => ({ symbol: c.symbol, name: c.name, price: c.price, changePct: c.changePct }))], [companies, costco]);
  const [q, setQ] = useState<Quote>(() => universe.find((u) => u.symbol === initialSymbol?.toUpperCase()) ?? costco);
  const [changing, setChanging] = useState(false);
  const [query, setQuery] = useState("");
  const [stance, setStance] = useState<PickStance>("buy");
  const [reason, setReason] = useState("");
  const [horizon, setHorizon] = useState<Pick["horizon"]>("3y");
  const [conf, setConf] = useState<Pick["confidence"]>(3);
  const [vis, setVis] = useState<Pick["visibility"]>("club");
  const sp = useSearchParams();
  const previewConnect = sp.get("preview") === "connect";
  const connectedOverride = sp.get("connected"); // proof-only render override
  const [promptFor, setPromptFor] = useState<string | null>(previewConnect ? q.symbol : null);
  const results = universe.filter((u) => !query || u.symbol.toLowerCase().includes(query.toLowerCase()) || u.name.toLowerCase().includes(query.toLowerCase()));

  function share() {
    const pick: Pick = {
      id: newId(), clubId: vis === "club" ? club.id : "public", authorId: "kway", author: "Kway", ago: "now", symbol: q.symbol, name: q.name, stance,
      reason: reason.trim(), horizon, confidence: conf, priceAtPick: q.price, agree: 0, notSure: 0, replies: [], visibility: vis,
    };
    write("fic.picks", [pick, ...read<Pick[]>("fic.picks", [])]);
    // Contextual connect (artboard 01): once, after the first shared Pick — never in onboarding.
    const connected = connectedOverride === "1" ? true : connectedOverride === "0" ? false : !!readJSON(BROKERAGE_KEY, null);
    const prompted = !!readJSON(PROMPTED_KEY, 0);
    if (!connected && !prompted) { setPromptFor(q.symbol); return; }
    if (embedded) { onDone?.(true); return; }
    router.push("/club");
  }
  const dismiss = () => (embedded ? onDone?.(false) : router.back());
  const seg = (on: boolean) => cx("flex-1 rounded-[13px] py-[11px] text-center text-[13.5px] transition", on ? "bg-green-tint border-2 border-green-2 text-green font-black" : "bg-card border-[1.5px] border-line text-ink-3 font-extrabold");

  if (promptFor) return <ConnectPromptSheet symbol={promptFor} onNotNow={() => (embedded ? onDone?.(true) : router.push("/club"))} />;

  const body = (
    <>

        {!changing ? (
          <div className="mt-3 bg-card border border-line rounded-[14px] px-[14px] py-[11px] flex items-center gap-[11px]">
            <TickerTile symbol={q.symbol} size={36} />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-black text-ink">{q.name}</div>
              <div className="text-[11px] font-bold text-ink-3">${q.price.toLocaleString(undefined, { minimumFractionDigits: 2 })} · {q.changePct >= 0 ? "+" : ""}{q.changePct}% today</div>
            </div>
            <button onClick={() => setChanging(true)} className="text-[11px] font-extrabold text-purple-2">Change</button>
          </div>
        ) : (
          <div className="mt-3 bg-card border border-line rounded-[14px] px-3 py-2">
            <div className="flex items-center gap-2">
              <SearchIcon className="text-ink-4" />
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search companies, ETFs…" className="flex-1 bg-transparent text-[13.5px] font-bold text-ink outline-none placeholder:text-ink-4" />
            </div>
            <div className="mt-1 max-h-[150px] overflow-y-auto no-scrollbar">
              {results.map((u) => (
                <button key={u.symbol} onClick={() => { setQ(u); setChanging(false); setQuery(""); }} className="w-full flex items-center gap-[10px] py-2 border-t border-paper-2 text-left">
                  <TickerTile symbol={u.symbol} size={28} />
                  <span className="flex-1 text-[12.5px] font-extrabold text-ink">{u.name}</span>
                  <span className="text-[11px] font-bold text-ink-3">${u.price.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-3" role="radiogroup" aria-label="Stance">
          {([["buy", "▲ Buy"], ["watch", "👁 Watch"], ["pass", "✕ Pass"]] as const).map(([id, label]) => (
            <button key={id} role="radio" aria-checked={stance === id} onClick={() => setStance(id)} className={seg(stance === id)}>{label}</button>
          ))}
        </div>

        <Eyebrow className="mt-3">YOUR REASON — ONE HONEST SENTENCE</Eyebrow>
        <div className="relative mt-[7px]">
          <textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, MAX))} placeholder="Everyone we know shops there, and 93% of members renew every year." rows={2} className="w-full bg-card border-[1.5px] border-line rounded-[14px] px-[15px] py-[13px] text-[14px] font-semibold text-ink leading-[1.5] outline-none focus:border-green-2 placeholder:text-ink-4 resize-none min-h-[64px]" />
          <span className="absolute right-3 bottom-2 text-[10px] font-bold text-ink-4">{reason.length}/{MAX}</span>
        </div>

        <div className="flex gap-4 mt-3">
          <div className="flex-1">
            <Eyebrow>TIME HORIZON</Eyebrow>
            <div className="flex gap-[6px] mt-[7px]" role="radiogroup">
              {HORIZONS.map((h) => (
                <button key={h} role="radio" aria-checked={horizon === h} onClick={() => setHorizon(h)} className={cx("rounded-[9px] px-[11px] py-[6px] text-[11.5px]", horizon === h ? "bg-green-2 text-cream-text font-black" : "bg-card border border-line text-ink-3 font-extrabold")}>{h}</button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <Eyebrow>CONFIDENCE</Eyebrow>
            <div className="flex gap-[5px] mt-[11px] items-center" role="slider" aria-valuemin={1} aria-valuemax={5} aria-valuenow={conf} aria-label="Confidence">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} aria-label={`${n} of 5`} onClick={() => setConf(n as Pick["confidence"])} className={cx("w-[22px] h-2 rounded-[4px]", n <= conf ? "bg-green-2" : "bg-line-3")} />
              ))}
              <span className="text-[11px] font-extrabold text-ink-3 ml-1">{conf}/5</span>
            </div>
          </div>
        </div>

        <Eyebrow className="mt-3">WHO SEES IT</Eyebrow>
        <div className="flex gap-2 mt-[7px]" role="radiogroup">
          <button role="radio" aria-checked={vis === "club"} onClick={() => setVis("club")} className={cx("flex-1 rounded-[13px] py-[10px] text-center text-[12.5px]", vis === "club" ? "bg-green-tint border-2 border-green-2 text-green font-black" : "bg-card border-[1.5px] border-line text-ink-3 font-extrabold")}>🔒 {club.shortName}</button>
          <button role="radio" aria-checked={vis === "public"} onClick={() => setVis("public")} className={cx("flex-1 rounded-[13px] py-[10px] text-center text-[12.5px]", vis === "public" ? "bg-green-tint border-2 border-green-2 text-green font-black" : "bg-card border-[1.5px] border-line text-ink-3 font-extrabold")}>🌍 Public</button>
        </div>

        <div className="mt-auto pt-5 pb-[calc(24px+env(safe-area-inset-bottom))]">
          <p className="text-center text-[11px] font-bold text-ink-4 mb-[9px]">Picks are timestamped — the club will see how it plays out. Not financial advice.</p>
          <Raised tone="green" onClick={share} disabled={reason.trim().length < 8}>{vis === "club" ? "Share Pick with the Club" : "Share Pick publicly"}</Raised>
        </div>
    </>
  );

  if (embedded) return <div className="flex flex-col flex-1 min-h-0">{body}</div>;
  return (
    <div className="absolute inset-0 z-50 bg-[#C9BFA8] flex flex-col">
      <button aria-label="Close" onClick={dismiss} className="h-[96px] shrink-0" />
      <div className="flex-1 bg-paper rounded-t-[28px] shadow-[0_-8px_30px_rgba(46,42,33,0.25)] flex flex-col px-5 pt-[14px] overflow-y-auto no-scrollbar">
        <div className="w-10 h-[5px] rounded-[3px] bg-[#D9CDB2] mx-auto" />
        <div className="flex items-center justify-between mt-[14px]">
          <div className="text-[18px] font-black text-ink">Make a Pick</div>
          <button aria-label="Close" onClick={dismiss} className="text-ink-4"><CloseIcon size={18} /></button>
        </div>
        {body}
      </div>
    </div>
  );
}
