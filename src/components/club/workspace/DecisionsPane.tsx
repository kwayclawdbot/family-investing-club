import { DecisionRecordRows } from "./OfficialPicks";
import { Logo } from "@/components/markets/Logo";
import Link from "next/link";
import type { ClubOverview, PortfolioTab } from "@/lib/types";
import type { DecisionRecord } from "@/lib/live/club";
import type { CircleView } from "@/lib/live/community";
import { cx } from "@/components/ui";
import { fmtPeople } from "@/lib/format";
import { Panel, Ring, SectionLabel } from "./shared";

const GLYPH = { "✓": "bg-green-tint text-green", "✕": "bg-[#F7E9E5] text-red", "⇅": "bg-orange-tint text-orange-2" } as const;
const glyphFor = (title: string): keyof typeof GLYPH => (/reject|remove|sell/i.test(title) ? "✕" : /trim|resize|reduce/i.test(title) ? "⇅" : "✓");

/** Club Decisions answers one question: what are we deciding? research → propose → vote → journal.
 *  Every number here is counted from `fic_club_proposals`, `fic_club_votes` and `fic_club_decisions`. */
export function DecisionsPane({ o, p, record, circles }: { o: ClubOverview; p: PortfolioTab; record: DecisionRecord | null; circles: CircleView[] | null }) {
  const d = o.activeDecision;
  const chips = record?.counts ?? [];
  const followed = (circles ?? []).filter((c) => c.open && c.joined);
  const journal = p.journal;
  return (
    <>
      {!!chips.length && (
        <div className="mt-[12px] flex gap-[6px]">
          {chips.map((c, i) => <span key={c.label} className={cx("rounded-[9px] px-[9px] py-[5px] text-[10.5px] font-black", i === 0 ? "bg-ink text-cream-text" : "bg-card border border-line text-ink-2")}>{c.label} · {c.n}</span>)}
        </div>
      )}
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
      {!!followed.length && (
        <>
          <SectionLabel className="mt-[13px] mb-[6px]">🌍 PUBLIC · CIRCLES YOU FOLLOW</SectionLabel>
          {followed.slice(0, 3).map((c) => (
            <Panel key={c.id} className="px-[13px] py-[10px] flex items-center gap-[10px] mb-[6px]">
              <span className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[17px]" style={{ background: c.tint }}>{c.emoji}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[12px] font-black text-ink truncate">{c.name} <span className="text-[9.5px] font-extrabold text-ink-4">· circle</span></span>
                <span className="block text-[9.5px] font-extrabold text-ink-3">{c.consensus} · {c.daysLeft}d left · {fmtPeople(c.people)} in</span>
              </span>
              <Link href={`/circle/${c.slug}`} className="bg-purple text-cream-text rounded-[9px] px-[11px] py-[6px] text-[10px] font-black">Open</Link>
            </Panel>
          ))}
        </>
      )}
      <div className="mt-[13px] mb-[6px] flex items-baseline justify-between"><SectionLabel>📊 MY DECISION RECORD</SectionLabel><Link href="/profile/performance" className="text-[10px] font-black text-green">Full record ›</Link></div>
      <Panel className="px-[13px] py-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[[String(record?.votesCast ?? 0), "VOTES CAST"], [record?.agedWellPct === null || record === null ? "—" : `${record.agedWellPct}%`, "AGED WELL"], [record?.avgOutcome ?? "—", "AVG OUTCOME"]].map(([v, l]) => <div key={l}><div className="text-[16px] font-black text-ink">{v}</div><div className="text-[8.5px] font-black tracking-[0.4px] text-ink-4">{l}</div></div>)}
        </div>
          <DecisionRecordRows record={record} />
      </Panel>
      <SectionLabel className="mt-[13px] mb-[6px]">RESEARCHING</SectionLabel>
      <Panel className="px-[14px] py-[3px]">
        {!o.research.length && <p className="py-4 text-center text-[11.5px] font-bold text-ink-3">Nothing being researched — assign a company from a pick or the watchlist.</p>}
        {o.research.map((r, i) => (
          <div key={r.symbol + r.assigneeId} className={cx("flex items-center gap-[10px] py-[9px]", i < o.research.length - 1 && "border-b border-paper-2")}>
            <Logo symbol={r.symbol} size={30} radius={9} />
            <div className="flex-1">
              <div className="text-[12.5px] font-extrabold text-ink">{r.name} — {r.assignee}{r.gated ? " 🎓" : ""}{r.status === "ready" ? " · ready ✓" : ""}</div>
              {r.status === "ready" ? <div className="text-[10px] font-bold text-ink-3">&ldquo;{r.note}&rdquo;{r.comments ? ` · 💬 ${r.comments}` : ""}</div> : r.note ? <div className="text-[10px] font-bold text-ink-3 truncate">{r.note}</div> : null}
            </div>
            {r.status === "ready" ? <Link href={`/club/propose?symbol=${r.symbol}`} className="bg-green-tint text-green rounded-[9px] px-[10px] py-[5px] text-[9.5px] font-black">→ Propose</Link> : <span className="text-[9.5px] font-extrabold text-orange-2">{r.due}</span>}
          </div>
        ))}
      </Panel>
      <SectionLabel className="mt-[13px] mb-[6px]">RECENTLY DECIDED · THE JOURNAL</SectionLabel>
      <Panel className="px-[15px] py-3">
        {!journal.length && <p className="py-3 text-center text-[11.5px] font-bold text-ink-3">The journal fills in as the club decides — what you believed, what would make you wrong, when to review.</p>}
        {journal.map((j, i) => {
          const glyph = glyphFor(j.title);
          return (
            <div key={`${j.title}-${j.date}`} className="flex gap-[9px]">
              <div className="flex flex-col items-center"><span className={cx("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black", GLYPH[glyph])}>{glyph}</span>{i < journal.length - 1 && <span className="flex-1 w-[2px] bg-line my-[3px]" />}</div>
              <div className={cx("flex-1", i < journal.length - 1 && "pb-[10px]")}>
                <div className="text-[12px] font-black text-ink">{j.title} <span className="text-[9px] text-ink-3">· {j.date}</span></div>
                {j.believed && <div className="text-[10.5px] font-bold text-ink-2 leading-[1.45]"><b className="text-ink">Believed:</b> {j.believed}</div>}
                {j.wrongIf && <div className="text-[10.5px] font-bold text-ink-2 leading-[1.45]"><b className="text-ink">Wrong if:</b> {j.wrongIf}</div>}
                {j.review && <div className="text-[10px] font-extrabold text-ink-3">Review: {j.review}</div>}
                {j.learned && <div className="text-[10.5px] font-bold text-ink-2 leading-[1.45]"><b className="text-ink">Learned:</b> {j.learned}</div>}
              </div>
            </div>
          );
        })}
      </Panel>
    </>
  );
}
