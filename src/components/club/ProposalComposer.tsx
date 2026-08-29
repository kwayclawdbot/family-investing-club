"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Club, ClubPortfolio, ClubProposal, Company, Idea, ResearchAssignment } from "@/lib/types";
import { cx } from "@/components/ui";
import { Sheet } from "@/components/ui/extras";
import { Eyebrow, Raised, ScreenHeader, TickerTile } from "./club-shared";
import { newId, read, write } from "./storage";

const WINDOWS = [3, 7, 14];

/** Artboard 03 — propose an add / remove / resize to the club's practice portfolio. */
export function ProposalComposer({ club, portfolio, companies, ideas, research, initialSymbol, template }: {
  club: Club; portfolio: ClubPortfolio; companies: Company[]; ideas: Idea[]; research: ResearchAssignment[]; initialSymbol?: string; template: ClubProposal;
}) {
  const router = useRouter();
  const me = club.members.find((m) => m.isYou);
  const names = useMemo(() => {
    const m: Record<string, string> = {};
    portfolio.holdings.forEach((h) => (m[h.symbol] = h.name));
    companies.forEach((c) => (m[c.symbol] = c.name));
    m.CEG = "Constellation Energy"; m.COST = "Costco Wholesale";
    return m;
  }, [portfolio, companies]);
  const start = (initialSymbol ?? template.symbol).toUpperCase();
  const [symbol, setSymbol] = useState(start);
  const held = portfolio.holdings.find((h) => h.symbol === symbol);
  const from = held?.weightPct ?? 0;
  const [kind, setKind] = useState<ClubProposal["kind"]>(() => (held ? (start === template.symbol ? template.kind : "resize") : "add"));
  const [to, setTo] = useState<number>(() => (start === template.symbol ? template.toWeightPct : held ? held.weightPct : 4));
  const [why, setWhy] = useState(start === template.symbol ? template.rationale : "");
  const [evidence, setEvidence] = useState(start === template.symbol ? template.evidence : []);
  const [windowDays, setWindowDays] = useState(7);
  const [sheet, setSheet] = useState<"symbol" | "evidence" | "window" | null>(null);
  const [query, setQuery] = useState("");
  const gated = club.members.filter((m) => m.voteGated);
  const voters = club.members.filter((m) => m.id !== "dad").length;
  const target = kind === "remove" ? 0 : to;
  const dollars = Math.round(((target - from) / 100) * portfolio.value);
  const max = club.rules.maxWeightPct;

  const candidates = [...portfolio.holdings.map((h) => h.symbol), ...companies.map((c) => c.symbol), "COST"].filter((s, i, a) => a.indexOf(s) === i);

  function submit() {
    const id = newId();
    const p: ClubProposal = {
      id, clubId: club.id, kind, symbol, name: names[symbol] ?? symbol, fromWeightPct: from, toWeightPct: target, practiceDollars: Math.abs(dollars), by: me?.name ?? "You", byId: me?.id ?? "kway", postedAgo: "just now",
      endsIn: `${windowDays} days`, rationale: why.trim(), evidence, votes: club.members.filter((m) => m.id !== "dad").map((m) => ({ memberId: m.id, vote: null })), status: "open",
    };
    write("fic.proposals", [p, ...read<ClubProposal[]>("fic.proposals", [])]);
    router.push(`/club/vote/${id}`);
  }
  const seg = (on: boolean) => cx("flex-1 rounded-[13px] py-[10px] text-center text-[13px] transition", on ? "bg-green-tint border-2 border-green-2 text-green font-black" : "bg-card border-[1.5px] border-line text-ink-3 font-extrabold");
  const pct = Math.round((target / max) * 100);

  return (
    <div className="flex flex-col min-h-full px-[2px]">
      <ScreenHeader backHref="/club" title="Propose to the club portfolio" />
      <div className="flex gap-2 mt-4" role="radiogroup" aria-label="Kind">
        {([["add", "＋ Add"], ["remove", "− Remove"], ["resize", "⇅ Resize"]] as const).map(([id, label]) => (
          <button key={id} role="radio" aria-checked={kind === id} disabled={id !== "add" && !held} onClick={() => { setKind(id); if (id === "resize" && held) setTo(Math.min(max, held.weightPct + 4)); if (id === "add" && !held) setTo(4); }} className={cx(seg(kind === id), "disabled:opacity-40")}>{label}</button>
        ))}
      </div>

      <div className="mt-3 bg-card border border-line rounded-[14px] px-[14px] py-[11px] flex items-center gap-[11px]">
        <TickerTile symbol={symbol} size={36} />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-black text-ink">{names[symbol] ?? symbol}</div>
          <div className="text-[11px] font-bold text-ink-3">{held ? `already ${held.weightPct}% of the portfolio` : "not in the portfolio yet"}</div>
        </div>
        <button onClick={() => setSheet("symbol")} className="text-[11px] font-extrabold text-purple-2">Change</button>
      </div>

      <Eyebrow className="mt-[14px]">PROPOSED WEIGHT</Eyebrow>
      <div className="mt-2 bg-card border border-line rounded-[16px] px-4 py-[14px]">
        <div className="flex justify-between items-baseline">
          <span className="text-[24px] font-black text-ink">{from}% → {target}%</span>
          <span className={cx("text-[12px] font-extrabold", dollars >= 0 ? "text-orange-2" : "text-red")}>{dollars >= 0 ? "+" : "−"}${Math.abs(dollars).toLocaleString()} practice dollars</span>
        </div>
        <div className="relative mt-3">
          <div className="h-[10px] rounded-[5px] bg-line-2 overflow-hidden">
            <div className="h-full rounded-[5px] bg-green-2" style={{ width: `${pct}%` }} />
          </div>
          <input type="range" min={0} max={max} step={1} value={target} disabled={kind === "remove"} onChange={(e) => setTo(Number(e.target.value))} aria-label="Proposed weight" className="absolute inset-0 w-full opacity-0 h-[24px] -top-[7px] cursor-pointer disabled:cursor-not-allowed" />
          <span className="absolute -top-[5px] w-5 h-5 rounded-full bg-green-2 border-[3px] border-[#FFFDF7] shadow-[0_1px_4px_rgba(46,42,33,0.3)] -translate-x-1/2 pointer-events-none" style={{ left: `${pct}%` }} />
        </div>
        <div className="flex justify-between mt-[7px] text-[10px] font-extrabold text-ink-4">
          <span>0%</span>
          <span>max {max}% per holding · club rule</span>
        </div>
      </div>

      <Eyebrow className="mt-3">WHY? · LINKED EVIDENCE</Eyebrow>
      <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={3} placeholder="What changed, and what would make you wrong?" className="mt-[7px] w-full bg-card border-[1.5px] border-line rounded-[14px] px-[15px] py-3 text-[13.5px] font-semibold text-ink leading-[1.5] outline-none focus:border-green-2 placeholder:text-ink-4 resize-none" />
      <div className="flex gap-[7px] mt-2 flex-wrap">
        {evidence.map((e) => (
          <button key={e.label} onClick={() => setEvidence(evidence.filter((x) => x.label !== e.label))} className={cx("rounded-[9px] px-[11px] py-[5px] text-[10.5px] font-black", e.label.startsWith("IDEA") ? "bg-orange-tint text-orange-2" : "bg-green-tint text-green")} title="Remove">📎 {e.label}</button>
        ))}
        <button onClick={() => setSheet("evidence")} className="rounded-[9px] px-[11px] py-[5px] text-[10.5px] font-black bg-card border border-dashed border-line-3 text-ink-3">+ attach</button>
      </div>

      <div className="flex gap-[9px] mt-3">
        <button onClick={() => setSheet("window")} className="flex-1 bg-card border border-line rounded-[13px] px-[13px] py-[10px] text-left">
          <div className="text-[10px] font-black text-ink-3">VOTING WINDOW</div>
          <div className="text-[13.5px] font-black text-ink mt-[3px]">{windowDays} days ▾</div>
        </button>
        <div className="flex-1 bg-card border border-line rounded-[13px] px-[13px] py-[10px]">
          <div className="text-[10px] font-black text-ink-3">WHO VOTES</div>
          <div className="text-[13.5px] font-black text-ink mt-[3px]">All {voters}{club.rules.kidsCanVote && gated.length ? " · kids gated 🎓" : ""}</div>
        </div>
      </div>
      {gated.map((g) => <p key={g.id} className="mt-[10px] text-center text-[11px] font-bold text-ink-4">{g.name} {g.gateReason}</p>)}

      <div className="mt-auto pt-5 pb-[44px]">
        <Raised tone="purple" onClick={submit} disabled={why.trim().length < 10 || (kind !== "remove" && target === from)}>Submit for Club Vote</Raised>
      </div>

      <Sheet open={sheet === "symbol"} onClose={() => setSheet(null)} title="Which holding?">
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="w-full bg-paper border border-line rounded-[12px] px-3 py-[9px] text-[13px] font-bold outline-none" />
        <div className="mt-2 max-h-[260px] overflow-y-auto no-scrollbar">
          {candidates.filter((s) => !query || s.toLowerCase().includes(query.toLowerCase()) || (names[s] ?? "").toLowerCase().includes(query.toLowerCase())).map((s) => {
            const h = portfolio.holdings.find((x) => x.symbol === s);
            return (
              <button key={s} onClick={() => { setSymbol(s); setKind(h ? "resize" : "add"); setTo(h ? Math.min(max, h.weightPct + 4) : 4); setSheet(null); setQuery(""); }} className="w-full flex items-center gap-[10px] py-[9px] border-b border-paper-2 text-left">
                <TickerTile symbol={s} size={28} />
                <span className="flex-1 text-[12.5px] font-extrabold text-ink">{names[s] ?? s}</span>
                <span className="text-[11px] font-bold text-ink-3">{h ? `${h.weightPct}%` : "new"}</span>
              </button>
            );
          })}
        </div>
      </Sheet>
      <Sheet open={sheet === "evidence"} onClose={() => setSheet(null)} title="Attach evidence">
        <div className="text-[10.5px] font-black text-ink-3">IDEAS</div>
        {ideas.map((i) => (
          <button key={i.id} onClick={() => { setEvidence([...evidence.filter((e) => e.label !== `IDEA: ${i.title.split(":")[0].toUpperCase()}`), { label: `IDEA: ${i.title.split(":")[0].toUpperCase()}`, href: `/club/idea/${i.id}` }]); setSheet(null); }} className="w-full text-left py-2 border-b border-paper-2 text-[12.5px] font-extrabold text-ink">📎 {i.title}</button>
        ))}
        <div className="mt-3 text-[10.5px] font-black text-ink-3">RESEARCH NOTES</div>
        {research.filter((r) => r.status === "done").map((r) => (
          <button key={r.id} onClick={() => { const label = `${r.assignee.toUpperCase()}'S RESEARCH`; setEvidence([...evidence.filter((e) => e.label !== label), { label, href: "/club/research" }]); setSheet(null); }} className="w-full text-left py-2 border-b border-paper-2 text-[12.5px] font-extrabold text-ink">📎 {r.assignee} · {r.name}</button>
        ))}
      </Sheet>
      <Sheet open={sheet === "window"} onClose={() => setSheet(null)} title="Voting window">
        <div className="flex gap-2">
          {WINDOWS.map((w) => (
            <button key={w} onClick={() => { setWindowDays(w); setSheet(null); }} className={cx("flex-1 rounded-[12px] py-3 text-[13px] font-black", windowDays === w ? "bg-green-2 text-cream-text" : "bg-paper border border-line text-ink-2")}>{w} days</button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
