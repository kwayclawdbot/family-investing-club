import { DecisionRecordRows } from "./OfficialPicks";
import Link from "next/link";
import type { ClubOverview } from "@/lib/types";
import { cx } from "@/components/ui";
import { decisionsJournal } from "@/lib/fixtures/v12-club";
import { decisionChips, publicPoll, decisionRecord } from "@/lib/fixtures/v13-club";
import { Panel, Ring, SectionLabel } from "./shared";

const GLYPH = { "✓": "bg-green-tint text-green", "✕": "bg-[#F7E9E5] text-red", "⇅": "bg-orange-tint text-orange-2" } as const;

/** v12 — Club Decisions answers one question: what are we deciding? research → propose → vote → journal. */
export function DecisionsPane({ o }: { o: ClubOverview }) {
  const d = o.activeDecision;
  return (
    <>
      <div className="mt-[12px] flex gap-[6px]">
        {decisionChips.map((c, i) => <span key={c.label} className={cx("rounded-[9px] px-[9px] py-[5px] text-[10.5px] font-black", i === 0 ? "bg-ink text-cream-text" : "bg-card border border-line text-ink-2")}>{c.label} · {c.n}</span>)}
      </div>
      <SectionLabel className="mt-[13px] mb-[6px]">🔒 YOUR CLUB · NEEDS YOUR VOTE</SectionLabel>
      {d ? (
        <div className="bg-purple-tint border border-[#DDD4F0] rounded-[16px] px-[15px] py-[13px]">
          <div className="flex items-center gap-3">
            <Ring pct={(d.voted / d.eligible) * 100} size={52} stroke={5} color="#8B7BC7" track="#E3D9F5"><span className="text-[11px] font-black text-ink">{d.voted}/{d.eligible}</span></Ring>
            <div className="flex-1"><div className="text-[15px] font-black text-ink">{d.title}</div><div className="text-[10.5px] font-extrabold text-ink-3">{d.by} proposed · 📎 nuclear idea + research · {d.hoursLeft}h left</div></div>
          </div>
          <div className="flex gap-2 mt-[11px]">
            <Link href={`/club/vote/${d.proposalId}`} className="flex-1 bg-purple text-cream-text rounded-[12px] py-[11px] text-center text-[13px] font-black shadow-[0_2px_0_#6B5CA8]">Vote now</Link>
            <Link href={`/club/vote/${d.proposalId}#case`} className="flex-1 bg-[#FFFDF7] border-[1.5px] border-[#DDD4F0] text-purple-2 rounded-[12px] py-[11px] text-center text-[13px] font-black">Read the case</Link>
          </div>
        </div>
      ) : <Panel className="px-4 py-5 text-center text-[12px] font-bold text-ink-3">No open decisions — propose one from a Pick or research note.</Panel>}
      <SectionLabel className="mt-[13px] mb-[6px]">🌍 PUBLIC · POLLS YOU FOLLOW</SectionLabel>
      <Panel className="px-[13px] py-[10px] flex items-center gap-[10px]">
        <span className="w-9 h-9 rounded-[10px] bg-[#F5EEE0] flex items-center justify-center text-[17px]">{publicPoll.emoji}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-[12px] font-black text-ink">{publicPoll.question} <span className="text-[9.5px] font-extrabold text-ink-4">· {publicPoll.circle} circle</span></span>
          <span className="block text-[9.5px] font-extrabold text-ink-3">{publicPoll.votes.toLocaleString()} votes · {publicPoll.yesPct}% yes · {publicPoll.closes}</span>
        </span>
        <Link href="/circle/fed-decision" className="bg-purple text-cream-text rounded-[9px] px-[11px] py-[6px] text-[10px] font-black">Vote</Link>
      </Panel>
      <div className="mt-[13px] mb-[6px] flex items-baseline justify-between"><SectionLabel>📊 MY DECISION RECORD</SectionLabel><Link href="/profile/performance" className="text-[10px] font-black text-green">Full record ›</Link></div>
      <Panel className="px-[13px] py-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[[decisionRecord.votesCast, "VOTES CAST"], [`${decisionRecord.agedWellPct}%`, "AGED WELL"], [decisionRecord.avgOutcome, "AVG OUTCOME"]].map(([v, l]) => <div key={l as string}><div className="text-[16px] font-black text-ink">{v as string}</div><div className="text-[8.5px] font-black tracking-[0.4px] text-ink-4">{l as string}</div></div>)}
        </div>
          <DecisionRecordRows />
      </Panel>
      <SectionLabel className="mt-[13px] mb-[6px]">RESEARCHING</SectionLabel>
      <Panel className="px-[14px] py-[3px]">
        {o.research.map((r, i) => (
          <div key={r.symbol + r.assigneeId} className={cx("flex items-center gap-[10px] py-[9px]", i < o.research.length - 1 && "border-b border-paper-2")}>
            <span className={cx("w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-[8.5px] font-black", r.status === "ready" ? "bg-[#FFFDF4] text-[#BC9227]" : "bg-line-2 text-ink-2")}>{r.symbol}</span>
            <div className="flex-1">
              <div className="text-[12.5px] font-extrabold text-ink">{r.name} — {r.assignee}{r.gated ? " 🎓" : ""}{r.status === "ready" ? " · ready ✓" : ""}</div>
              {r.status === "ready" ? <div className="text-[10px] font-bold text-ink-3">&ldquo;{r.note}&rdquo; · 💬 {r.comments ?? 6}</div> : <div className="h-1 rounded-[2px] bg-line-2 mt-1 w-[130px]"><div className="h-full rounded-[2px] bg-orange" style={{ width: "60%" }} /></div>}
            </div>
            {r.status === "ready" ? <Link href={`/club/propose?symbol=${r.symbol}`} className="bg-green-tint text-green rounded-[9px] px-[10px] py-[5px] text-[9.5px] font-black">→ Propose</Link> : <span className="text-[9.5px] font-extrabold text-orange-2">{r.due}</span>}
          </div>
        ))}
      </Panel>
      <SectionLabel className="mt-[13px] mb-[6px]">RECENTLY DECIDED · THE JOURNAL</SectionLabel>
      <Panel className="px-[15px] py-3">
        {decisionsJournal.map((j, i) => (
          <div key={j.title} className="flex gap-[9px]">
            <div className="flex flex-col items-center"><span className={cx("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black", GLYPH[j.glyph])}>{j.glyph}</span>{i < decisionsJournal.length - 1 && <span className="flex-1 w-[2px] bg-line my-[3px]" />}</div>
            <div className={cx("flex-1", i < decisionsJournal.length - 1 && "pb-[10px]")}>
              <div className="text-[12px] font-black text-ink">{j.title} <span className="text-[9px] text-ink-3">· {j.date} · {j.vote}</span></div>
              <div className="text-[10.5px] font-bold text-ink-2 leading-[1.45]">{j.body} {j.since && <b className={j.sinceTone === "bad" ? "text-red" : "text-[#3A8C4A]"}>{j.since}</b>}</div>
            </div>
          </div>
        ))}
      </Panel>
    </>
  );
}
