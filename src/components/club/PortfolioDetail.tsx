"use client";
import Link from "next/link";
import { useState } from "react";
import type { ModelPortfolio, Proposal } from "@/lib/types";
import { Button, Tag, cx } from "@/components/ui";
import { Sheet } from "@/components/ui/extras";
import { ChevronLeft, MoreIcon } from "@/components/ui/icons";
import { useStored } from "./storage";

const KIND_TONE: Record<Proposal["kind"], "green" | "orange" | "purple"> = { add: "green", remove: "orange", resize: "purple" };
const kindVerb = (k: Proposal["kind"]) => (k === "add" ? "Add" : k === "remove" ? "Remove" : "Resize");
/** "Add CCJ — \"Uranium supply is the bottleneck\"" from the rationale's first clause. */
const headline = (p: Proposal) => `${kindVerb(p.kind)} ${p.symbol} — “${p.rationale.split(/[;,.]/)[0].trim().slice(0, 44)}” thesis`;

/** Artboard 27 — public educational model portfolio: holdings with thesis, the open proposal with a vote, public change history. */
export function PortfolioDetail({ p }: { p: ModelPortfolio }) {
  const [votes, setVotes] = useStored<Record<string, "for" | "against">>("fic.votes", {});
  const [mine, setMine] = useStored<Proposal[]>(`fic.proposals.${p.id}`, []);
  const [showAll, setShowAll] = useState(false);
  const [history, setHistory] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ kind: Proposal["kind"]; symbol: string; rationale: string }>({ kind: "add", symbol: "", rationale: "" });

  const proposals = [...mine, ...p.proposals];
  const openOnes = proposals.filter((x) => x.status === "open");
  const closed = proposals.filter((x) => x.status !== "open");
  const holdings = showAll ? p.holdings : p.holdings.slice(0, 3);

  function submit() {
    if (!form.symbol.trim() || form.rationale.trim().length < 10) return;
    setMine((prev) => [{ id: `mine-${Date.now()}`, kind: form.kind, symbol: form.symbol.toUpperCase().trim(), by: "Kway M.", ago: "Just now", rationale: form.rationale.trim(), votesFor: 0, votesAgainst: 0, status: "open" }, ...prev]);
    setForm({ kind: "add", symbol: "", rationale: "" });
    setOpen(false);
  }

  return (
    <div className="pt-[14px] pb-6">
      <div className="flex items-center justify-between">
        <Link href="/club" aria-label="Back" className="text-ink-3"><ChevronLeft size={22} /></Link>
        <span className="rounded-[20px] bg-green-tint px-[13px] py-[5px] text-[11px] font-black text-green">MODEL PORTFOLIO · EDUCATIONAL</span>
        <span className="text-ink-4"><MoreIcon /></span>
      </div>
      <h1 className="mt-3 text-[21px] font-black text-ink">{p.name}</h1>
      <div className="text-[12px] font-bold text-ink-3">Simulated — no member money is pooled · {p.followers} followers</div>
      <Link href="/club/portfolio" className="mt-2 inline-block text-[11.5px] font-extrabold text-purple-2">Public model portfolio · your club&apos;s own portfolio is in My Club → Portfolio →</Link>

      <div className="flex gap-[9px] mt-3">
        <div className="flex-1 rounded-[14px] border border-line bg-card px-[13px] py-[11px]">
          <div className="text-[10.5px] font-extrabold text-ink-3">THIS PORTFOLIO · YTD</div>
          <div className="text-[19px] font-black text-[#3A8C4A]">+{p.ytdPct}%</div>
        </div>
        <div className="flex-1 rounded-[14px] border border-line bg-card px-[13px] py-[11px]">
          <div className="text-[10.5px] font-extrabold text-ink-3">S&amp;P 500 BENCHMARK</div>
          <div className="text-[19px] font-black text-ink">+{p.benchmarkYtdPct}%</div>
        </div>
      </div>

      <div className="mt-[10px] rounded-[16px] border border-line bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-black text-ink">Holdings · {p.holdings.length}</span>
          <span className="text-[11px] font-extrabold text-ink-3">every holding has a thesis</span>
        </div>
        {holdings.map((h, i) => (
          <Link key={h.symbol} href={`/discover/${h.symbol}`} className={cx("flex items-center gap-[11px] py-[10px]", i < holdings.length - 1 && "border-b border-paper-2")}>
            <span className={cx("w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[10px] font-black shrink-0", h.symbol === "VOO" ? "bg-orange-tint text-orange-2" : "bg-green-tint text-green")}>{h.symbol}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-extrabold text-ink truncate">{h.name}</div>
              <div className="text-[10.5px] font-bold text-purple-2" title={h.thesis}>View thesis →</div>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-black text-ink">{h.weightPct}%</div>
              <div className={cx("text-[11px] font-extrabold", h.changePct >= 0 ? "text-[#3A8C4A]" : "text-red")}>{h.changePct >= 0 ? "+" : "−"}{Math.abs(h.changePct).toFixed(0)}%</div>
            </div>
          </Link>
        ))}
        {p.holdings.length > 3 && (
          <button onClick={() => setShowAll((v) => !v)} className="w-full pt-2 text-center text-[11.5px] font-extrabold text-green">{showAll ? "Show fewer ▴" : `Show all ${p.holdings.length} ▾`}</button>
        )}
      </div>

      {openOnes.map((pr) => {
        const v = votes[pr.id];
        const f = pr.votesFor + (v === "for" ? 1 : 0);
        const a = pr.votesAgainst + (v === "against" ? 1 : 0);
        const total = Math.max(1, f + a);
        const fp = Math.round((f / total) * 100);
        return (
          <div key={pr.id} className="mt-[10px] rounded-[16px] border border-[#DDD4F0] bg-purple-tint px-4 py-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-purple-2">OPEN PROPOSAL · VOTING ENDS IN 2 DAYS</span>
              <span className="text-[11px] font-extrabold text-ink-3">{f + a} votes</span>
            </div>
            <div className="mt-[6px] text-[14px] font-black text-ink leading-[1.3]">{headline(pr)}</div>
            <p className="mt-1 text-[12px] font-semibold text-ink-2 leading-[1.45]">{pr.rationale} <span className="text-ink-4">· {pr.by}</span></p>
            <div className="flex gap-2 mt-[10px]">
              <button disabled={!!v} onClick={() => setVotes((s) => ({ ...s, [pr.id]: "for" }))}
                className={cx("flex-1 rounded-[11px] py-[9px] text-center text-[12.5px] font-black transition", v === "against" ? "bg-card border-[1.5px] border-[#DDD4F0] text-ink-2" : "bg-green-2 text-cream-text")}>For · {fp}%{v === "for" ? " ✓" : ""}</button>
              <button disabled={!!v} onClick={() => setVotes((s) => ({ ...s, [pr.id]: "against" }))}
                className={cx("flex-1 rounded-[11px] py-[9px] text-center text-[12.5px] font-black transition", v === "against" ? "bg-red text-cream-text" : "bg-card border-[1.5px] border-[#DDD4F0] text-ink-2")}>Against · {100 - fp}%{v === "against" ? " ✓" : ""}</button>
            </div>
            {v && <div className="mt-2 text-[11px] font-extrabold text-ink-3">You voted {v} · one vote per member</div>}
          </div>
        );
      })}

      <button onClick={() => setHistory((h) => !h)} className="mt-[10px] w-full text-center text-[11.5px] font-bold text-ink-3">Change history is public — see how the thinking evolved {history ? "▴" : "→"}</button>
      {history && (
        <ol className="mt-2 rounded-[16px] border border-line bg-card px-4 py-2">
          {[...mine.map((m) => ({ ago: m.ago, text: `Proposal opened: ${m.kind} ${m.symbol}` })), ...closed.map((c) => ({ ago: c.ago, text: `${kindVerb(c.kind)} ${c.symbol} · ${c.status} ${c.votesFor}–${c.votesAgainst}` })), ...p.history].map((h, i, arr) => (
            <li key={i} className={cx("flex gap-3 py-3", i < arr.length - 1 && "border-b border-paper-2")}>
              <span className="mt-[5px] w-[9px] h-[9px] rounded-full bg-green-2 shrink-0" />
              <div><div className="text-[13px] font-extrabold text-ink">{h.text}</div><div className="text-[11px] font-bold text-ink-4">{h.ago}</div></div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-3"><Button variant="secondary" size="md" full onClick={() => setOpen(true)}>＋ Propose a change</Button></div>
      <p className="mt-3 text-[10.5px] font-semibold text-ink-4 leading-[1.4]">Educational model portfolio. No member money is pooled or invested; performance is simulated from real prices against a benchmark, for learning only.</p>

      <Sheet open={open} onClose={() => setOpen(false)} title="Propose a change">
        <div className="flex gap-[6px]" role="radiogroup">
          {(["add", "remove", "resize"] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={form.kind === k} onClick={() => setForm((f) => ({ ...f, kind: k }))}
              className={cx("flex-1 h-[36px] rounded-[10px] text-[12.5px] font-extrabold capitalize", form.kind === k ? "bg-green text-cream-text" : "bg-paper-2 text-ink-3")}><Tag tone={KIND_TONE[k]} className="mr-1">{k}</Tag></button>
          ))}
        </div>
        <input value={form.symbol} onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))} placeholder="Ticker — e.g. CCJ" className="mt-3 w-full h-[44px] rounded-[12px] border border-line bg-paper-2 px-3 text-[13.5px] font-bold uppercase outline-none focus:border-green" />
        <textarea value={form.rationale} onChange={(e) => setForm((f) => ({ ...f, rationale: e.target.value }))} placeholder="Rationale — why, and what risk does it add?" className="mt-2 w-full min-h-[90px] rounded-[12px] border border-line bg-paper-2 px-3 py-[10px] text-[13.5px] font-bold outline-none focus:border-green" />
        <Button full className="mt-3" onClick={submit} disabled={!form.symbol.trim() || form.rationale.trim().length < 10}>Open proposal for discussion</Button>
      </Sheet>
    </div>
  );
}
