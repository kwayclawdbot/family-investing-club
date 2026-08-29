import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProgressBar, Tag, cx } from "@/components/ui";
import { EmptyState, StatTile } from "@/components/ui/extras";
import { TopBar } from "@/components/shell/TopBar";
import { MemberAvatar } from "@/components/family/MemberAvatar";
import { GuardrailControls } from "@/components/family/GuardrailControls";
import { ReportNoteForm } from "@/components/family/ReportNoteForm";
import { getHousehold, getLearnerReport } from "@/lib/live/family";

/** Parent view per learner: child_report_stats + lesson_progress + xp_events + badge_awards + guardrails + activity + notes. */
export default async function LearnerPage(props: PageProps<"/family/members/[id]">) {
  const { id } = await props.params;
  const family = await getHousehold();
  if (!family) redirect("/family");
  if (!family.isParent) redirect("/family");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const r = await getLearnerReport(id);
  if (!r) notFound();
  const { member: m, report, lessons } = r;
  const pct = report.lessonsTotal ? Math.round((report.lessonsDone / report.lessonsTotal) * 100) : 0;
  const roleTag = m.isKid ? (m.ageGroup === "kids" ? { label: "Child", tone: "orange" as const } : { label: "Teen", tone: "purple" as const }) : { label: "Parent", tone: "green" as const };
  const needs: string[] = [];
  if (report.quizLow > 0) needs.push(`${report.quizLow} quiz${report.quizLow === 1 ? "" : "zes"} under 70% — worth a retake`);
  if (report.behind != null && report.behind > 0) needs.push(`${report.behind} lesson${report.behind === 1 ? "" : "s"} behind the cohort pace`);
  if (report.practiceStale) needs.push("No practice or games in the last 7 days");
  if (m.activeDaysThisWeek === 0) needs.push("Hasn't earned XP this week — a 5-minute lesson restarts the habit");

  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/family/members" title="Learner" />
      <div className="px-[18px] pb-6">
        <div className="flex items-center gap-[14px]">
          <MemberAvatar name={m.name} color={m.color} avatarUrl={m.avatarUrl} size={56} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2"><h1 className="text-[20px] font-black text-ink truncate">{m.fullName}</h1><Tag tone={roleTag.tone}>{roleTag.label}</Tag></div>
            <div className="text-[12px] font-bold text-ink-3">{m.level} level · active {m.lastActive.toLowerCase()}{m.username ? ` · @${m.username}` : ""}</div>
          </div>
        </div>
        {m.isKid && <p className="mt-2 text-[11.5px] font-bold text-ink-4">You&apos;re viewing {m.name}&apos;s progress, not their account.</p>}

        <div className="mt-3 flex gap-[9px]">
          <StatTile value={`🔥 ${m.activeDaysThisWeek}`} label="active days" />
          <StatTile value={m.weekXp} label="XP this week" tone="green" />
          <StatTile value={`${pct}%`} label="lessons done" tone="orange" />
        </div>

        <div className="mt-3 bg-card border border-line rounded-card px-4 py-[13px]">
          <div className="flex items-center justify-between"><div className="text-[11px] font-black text-orange tracking-[0.5px]">REPORT CARD</div><span className="text-[10px] font-bold text-ink-4">{report.source === "rpc" ? (report.cohortWeek ? `cohort week ${report.cohortWeek}` : "all published lessons") : "from progress tables"}</span></div>
          <div className="mt-1 text-[15px] font-black text-ink">{report.lessonsDone} of {report.lessonsTotal} lessons</div>
          <ProgressBar value={pct} className="mt-2" />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[[report.quizAvg != null ? `${report.quizAvg}%` : "—", `quiz avg · ${report.quizCount}`], [report.gameCount ? String(report.gameBest) : "—", `best game · ${report.gameCount}`], [report.xp.toLocaleString(), `XP · ${report.badges} badge${report.badges === 1 ? "" : "s"}`]].map(([v, l]) => (
              <div key={l} className="rounded-[12px] bg-paper-2 px-2 py-2"><div className="text-[15px] font-black text-ink">{v}</div><div className="text-[9.5px] font-extrabold text-ink-3 uppercase tracking-[0.3px]">{l}</div></div>
            ))}
          </div>
          {r.paper && <div className="mt-3 text-[12px] font-bold text-ink-3">Practice portfolio: ${r.paper.balance.toLocaleString("en-US", { maximumFractionDigits: 0 })}{r.paper.returnPct != null ? ` · ${r.paper.returnPct >= 0 ? "+" : ""}${r.paper.returnPct}%` : ""} · {r.paper.positions} position{r.paper.positions === 1 ? "" : "s"} · virtual money only</div>}
        </div>

        <h2 className="mt-4 mb-2 text-[15px] font-black text-ink">Needs practice</h2>
        {needs.length === 0 ? (
          <div className="bg-green-tint border border-green-line rounded-card px-4 py-3 text-[13px] font-bold text-green">Nothing flagged this week — nice.</div>
        ) : (
          <div className="bg-card border border-line rounded-card px-4 py-1">
            {needs.map((n, i) => (
              <div key={n} className={cx("flex items-center gap-3 py-3", i < needs.length - 1 && "border-b border-paper-2")}>
                <span className="w-8 h-8 rounded-[10px] bg-orange-tint text-orange-2 flex items-center justify-center text-[14px]">📝</span>
                <span className="flex-1 text-[13px] font-extrabold text-ink">{n}</span>
              </div>
            ))}
          </div>
        )}

        <h2 className="mt-4 mb-2 text-[15px] font-black text-ink">Recent lessons</h2>
        {lessons.recent.length === 0 ? <EmptyState emoji="📚" title="No lessons opened yet" body={`${m.name} hasn't started a lesson. The first one takes about five minutes.`} /> : (
          <div className="bg-card border border-line rounded-card px-4 py-1">
            {lessons.recent.map((l, i) => (
              <div key={l.id} className={cx("flex items-center gap-3 py-[10px]", i < lessons.recent.length - 1 && "border-b border-paper-2")}>
                <div className="flex-1 min-w-0"><div className="text-[13px] font-extrabold text-ink truncate">{l.title}</div><div className="text-[11px] font-bold text-ink-3">{l.status === "completed" ? "Completed" : `${l.pct}% · in progress`} · {l.ago} ago</div></div>
                <span className={cx("text-[11px] font-black", l.status === "completed" ? "text-green" : "text-orange-2")}>{l.status === "completed" ? "✓" : "…"}</span>
              </div>
            ))}
            <div className="py-2 text-[11px] font-bold text-ink-4">{lessons.completed} completed · {lessons.minutes} min of lessons total</div>
          </div>
        )}

        <div className="mt-4 flex gap-[9px]">
          <div className="flex-1">
            <h2 className="mb-2 text-[15px] font-black text-ink">Recent XP</h2>
            <div className="bg-card border border-line rounded-card px-3 py-1 min-h-[60px]">
              {r.recentXp.length === 0 && <div className="py-3 text-[11.5px] font-bold text-ink-4">No XP yet.</div>}
              {r.recentXp.slice(0, 5).map((e, i) => <div key={e.id} className={cx("flex justify-between gap-2 py-2 text-[11.5px] font-bold", i < Math.min(5, r.recentXp.length) - 1 && "border-b border-paper-2")}><span className="text-ink truncate">{e.label}</span><span className="text-green shrink-0">+{e.xp}</span></div>)}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="mb-2 text-[15px] font-black text-ink">Badges</h2>
            <div className="bg-card border border-line rounded-card px-3 py-2 min-h-[60px]">
              {r.badges.length === 0 && <div className="py-1 text-[11.5px] font-bold text-ink-4">None yet — badges reward learning, never risk.</div>}
              <div className="flex flex-wrap gap-2">{r.badges.map((b) => <span key={b.id} title={b.title} className="w-9 h-9 rounded-full bg-green-tint border-2 border-green-2 flex items-center justify-center text-[16px]">{b.emoji}</span>)}</div>
            </div>
          </div>
        </div>

        {m.isKid && r.guardrails && (
          <>
            <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Guardian controls</h2>
            <GuardrailControls childName={m.name} initial={r.guardrails} events={r.guardrailEvents} />
            <div className="mt-3 bg-card border border-line rounded-card px-4 py-3">
              <div className="flex items-center justify-between"><span className="text-[13px] font-extrabold text-ink">Time on family screens</span><span className="text-[12.5px] font-black text-ink">{r.activityMinutesWeek} min · 7 days</span></div>
              <div className="mt-2 flex items-end gap-1 h-[36px]">
                {r.activityWeek.map(({ day, minutes: mins }) => { const max = Math.max(1, ...r.activityWeek.map((a) => a.minutes)); return <div key={day} title={`${day}: ${mins} min`} className={cx("flex-1 rounded-[4px]", mins ? "bg-purple" : "bg-line-2")} style={{ height: `${Math.max(6, (mins / max) * 100)}%` }} />; })}
              </div>
              <div className="mt-1 text-[10.5px] font-bold text-ink-4">Counted while a family screen is open on {m.name}&apos;s account.</div>
            </div>
          </>
        )}

        <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Your note</h2>
        <ReportNoteForm childId={m.id} week={r.noteWeek} initial={r.note?.week === r.noteWeek ? r.note.note : ""} />
        {r.note && r.note.week !== r.noteWeek && <p className="mt-2 text-[11.5px] font-bold text-ink-4">Last note (week {r.note.week % 100}): &ldquo;{r.note.note}&rdquo;</p>}
        <p className="mt-3 text-center text-[11px] font-bold text-ink-4"><Link href="/family/night" className="text-purple-2 font-extrabold">Run a Family Investing Night ›</Link></p>
      </div>
    </div>
  );
}
