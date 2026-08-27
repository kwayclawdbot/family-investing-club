"use client";
import Link from "next/link";
import { useState } from "react";
import type { ModelPortfolio, Proposal } from "@/lib/types";
import { Button, Segmented, Tag, cx } from "@/components/ui";
import { Sheet } from "@/components/ui/extras";
import { LineChart } from "@/components/markets/LineChart";
import { useStored } from "./storage";

const TABS = ["Holdings", "Proposals", "History"];
const KIND_TONE: Record<Proposal["kind"], "green" | "orange" | "purple"> = { add: "green", remove: "orange", resize: "purple" };

export function PortfolioDetail({ p }: { p: ModelPortfolio }) {
  const [tab, setTab] = useState("Holdings");
  const [votes, setVotes] = useStored<Record<string, "for" | "against">>("fic.votes", {});
  const [mine, setMine] = useStored<Proposal[]>(`fic.proposals.${p.id}`, []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ kind: Proposal["kind"]; symbol: string; rationale: string }>({ kind: "add", symbol: "", rationale: "" });
  const top = Math.max(...p.holdings.map((h) => h.weightPct));
  const beat = p.ytdPct - p.benchmarkYtdPct;

  function submit() {
    if (!form.symbol.trim() || form.rationale.trim().length < 10) return;
    setMine((prev) => [{ id: `mine-${Date.now()}`, kind: form.kind, symbol: form.symbol.toUpperCase().trim(), by: "Kway M.", ago: "Just now", rationale: form.rationale.trim(), votesFor: 0, votesAgainst: 0, status: "open" }, ...prev]);
    setForm({ kind: "add", symbol: "", rationale: "" });
    setOpen(false);
  }

  const proposals = [...mine, ...p.proposals];

  return (
    <div className="pb-6">
      <div className="flex items-center gap-3 mt-1">
        <span className="w-11 h-11 rounded-[13px] bg-green text-white flex items-center justify-center text-[14px] font-black">M</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-[19px] font-black text-ink leading-tight">{p.name}</h1>
          <div className="mt-[3px] flex items-center gap-2">
            <Tag tone="green">Educational model · virtual money</Tag>
            <span className="text-[11px] font-bold text-ink-4">{p.followers} followers</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[12.5px] font-semibold text-ink-3 leading-[1.5]">{p.blurb}</p>

      <div className="mt-3 bg-card border border-line rounded-card px-4 py-[14px]">
        <div className="flex items-end gap-6">
          <div>
            <div className="text-[24px] font-black text-[#3A8C4A] leading-none">+{p.ytdPct}%</div>
            <div className="mt-1 text-[11px] font-extrabold text-ink-3">YTD · this portfolio</div>
          </div>
          <div>
            <div className="text-[18px] font-black text-ink-2 leading-none">+{p.benchmarkYtdPct}%</div>
            <div className="mt-1 text-[11px] font-extrabold text-ink-3">YTD · S&amp;P 500 (VOO)</div>
          </div>
          <div className="ml-auto text-right">
            <div className={cx("text-[13px] font-black", beat >= 0 ? "text-green" : "text-red")}>{beat >= 0 ? "+" : ""}{beat.toFixed(1)} pts</div>
            <div className="text-[10px] font-extrabold text-ink-4 uppercase">vs benchmark</div>
          </div>
        </div>
        <div className="mt-3">
          <LineChart data={p.series} color="#4C8C4A" height={90} fill />
        </div>
      </div>

      <Segmented items={TABS} value={tab} onChange={setTab} tone="green" className="mt-4" />

      {tab === "Holdings" && (
        <div className="mt-3 bg-card border border-line rounded-card px-4 py-1">
          {p.holdings.map((h, i) => (
            <Link key={h.symbol} href={`/markets/${h.symbol}`} className={cx("block py-3", i < p.holdings.length - 1 && "border-b border-paper-2")}>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-[10px] bg-green-tint text-green text-[10px] font-black flex items-center justify-center">{h.symbol}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-black text-ink truncate">{h.name}</div>
                  <div className="text-[11px] font-bold text-ink-4">added {h.addedAgo}</div>
                </div>
                <div className="text-right">
                  <div className="text-[13.5px] font-black text-ink">{h.weightPct}%</div>
                  <div className={cx("text-[11px] font-black", h.changePct >= 0 ? "text-[#3A8C4A]" : "text-red")}>{h.changePct >= 0 ? "+" : "−"}{Math.abs(h.changePct).toFixed(1)}%</div>
                </div>
              </div>
              <div className="mt-2 h-[6px] rounded-[4px] bg-line-2 overflow-hidden"><div className="h-full rounded-[4px] bg-green-2" style={{ width: `${(h.weightPct / top) * 100}%` }} /></div>
              <div className="mt-[6px] text-[12px] font-semibold text-ink-2"><span className="text-ink-4 font-extrabold">Thesis · </span>{h.thesis}</div>
            </Link>
          ))}
          <div className="py-3 text-[11.5px] font-bold text-ink-4">Remaining {100 - p.holdings.reduce((a, h) => a + h.weightPct, 0)}% held as virtual cash.</div>
        </div>
      )}

      {tab === "Proposals" && (
        <div className="mt-3">
          <Button variant="secondary" size="md" full onClick={() => setOpen(true)}>＋ Propose a change</Button>
          {proposals.map((pr) => {
            const v = votes[pr.id];
            const f = pr.votesFor + (v === "for" ? 1 : 0);
            const a = pr.votesAgainst + (v === "against" ? 1 : 0);
            const total = Math.max(1, f + a);
            return (
              <div key={pr.id} className="mt-3 bg-card border border-line rounded-card px-4 py-[14px]">
                <div className="flex items-center gap-2">
                  <Tag tone={KIND_TONE[pr.kind]}>{pr.kind}</Tag>
                  <span className="text-[14px] font-black text-ink">{pr.symbol}</span>
                  <span className="ml-auto text-[11px] font-bold text-ink-4">{pr.by} · {pr.ago}</span>
                </div>
                <p className="mt-2 text-[13px] font-semibold text-ink-2 leading-[1.5]">{pr.rationale}</p>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-extrabold">
                  <span className="text-green">{f} for</span>
                  <div className="flex-1 h-[7px] rounded-[4px] bg-[#F3DDD6] overflow-hidden"><div className="h-full bg-green-2" style={{ width: `${(f / total) * 100}%` }} /></div>
                  <span className="text-red">{a} against</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {pr.status === "open" ? (
                    v ? (
                      <span className="text-[12px] font-extrabold text-ink-3">You voted <b className={v === "for" ? "text-green" : "text-red"}>{v}</b> · one vote per member</span>
                    ) : (
                      <>
                        <button onClick={() => setVotes((s) => ({ ...s, [pr.id]: "for" }))} className="flex-1 h-[36px] rounded-[10px] bg-green-2 text-cream-text text-[12.5px] font-black">Vote for</button>
                        <button onClick={() => setVotes((s) => ({ ...s, [pr.id]: "against" }))} className="flex-1 h-[36px] rounded-[10px] border-2 border-line text-ink-2 text-[12.5px] font-black">Vote against</button>
                      </>
                    )
                  ) : (
                    <Tag tone={pr.status === "passed" ? "green" : "muted"}>{pr.status}</Tag>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "History" && (
        <ol className="mt-3 bg-card border border-line rounded-card px-4 py-2">
          {[...mine.map((m) => ({ ago: m.ago, text: `Proposal opened: ${m.kind} ${m.symbol}` })), ...p.history].map((h, i, arr) => (
            <li key={i} className={cx("flex gap-3 py-3", i < arr.length - 1 && "border-b border-paper-2")}>
              <span className="mt-[5px] w-[9px] h-[9px] rounded-full bg-green-2 shrink-0" />
              <div>
                <div className="text-[13px] font-extrabold text-ink">{h.text}</div>
                <div className="text-[11px] font-bold text-ink-4">{h.ago}</div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-4 text-[10.5px] font-semibold text-ink-4 leading-[1.4]">
        This is an educational model portfolio. No member money is pooled or invested. Performance is simulated from real prices and shown against a benchmark for learning purposes only.
      </p>

      <Sheet open={open} onClose={() => setOpen(false)} title="Propose a change">
        <div className="flex gap-[6px]" role="radiogroup">
          {(["add", "remove", "resize"] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={form.kind === k} onClick={() => setForm((f) => ({ ...f, kind: k }))}
              className={cx("flex-1 h-[36px] rounded-[10px] text-[12.5px] font-extrabold capitalize", form.kind === k ? "bg-green text-cream-text" : "bg-paper-2 text-ink-3")}>{k}</button>
          ))}
        </div>
        <input value={form.symbol} onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))} placeholder="Ticker — e.g. CCJ" className="mt-3 w-full h-[44px] rounded-[12px] border border-line bg-paper-2 px-3 text-[13.5px] font-bold uppercase outline-none focus:border-green" />
        <textarea value={form.rationale} onChange={(e) => setForm((f) => ({ ...f, rationale: e.target.value }))} placeholder="Rationale — why, and what risk does it add?" className="mt-2 w-full min-h-[90px] rounded-[12px] border border-line bg-paper-2 px-3 py-[10px] text-[13.5px] font-bold outline-none focus:border-green" />
        <Button full className="mt-3" onClick={submit} disabled={!form.symbol.trim() || form.rationale.trim().length < 10}>Open proposal for discussion</Button>
      </Sheet>
    </div>
  );
}
