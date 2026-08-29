import Link from "next/link";
import type { CourseDetail } from "@/lib/learn/types";
import { Eyebrow } from "@/components/markets/v12/bits";

type NodeState = "mastered" | "done" | "next" | "locked" | "checkpoint";

/** Learn — "What should I learn next?": the member's active course, its real lessons, and the next one.
 *  `course` is `getCourse(slug)` for whichever course their continue-lesson belongs to. */
export function LearnV12({ streak, course, embedded }: { streak: number; course: CourseDetail | null; embedded?: boolean }) {
  const icon = (s: NodeState) => s === "mastered" || s === "done" ? <span className="w-[22px] h-[22px] rounded-full bg-green-2 text-white text-[13px] font-black flex items-center justify-center">✓</span> : s === "next" ? <span className="w-[22px] h-[22px] rounded-full bg-green text-white text-[11px] flex items-center justify-center">▶</span> : s === "checkpoint" ? <span className="w-[22px] h-[22px] rounded-full bg-gold text-[13px] flex items-center justify-center">⭐</span> : <span className="w-[22px] h-[22px] rounded-full bg-line-3 text-white text-[11px] flex items-center justify-center">🔒</span>;
  const lessons = (course?.modules ?? []).flatMap((m) => m.lessons);
  const next = course?.nextLesson ?? null;
  const nodes = lessons.map((l): { key: string; title: string; state: NodeState } => ({
    key: l.id, title: l.title,
    state: l.kind === "checkpoint" ? "checkpoint" : l.status === "completed" ? "mastered" : next && l.id === next.id ? "next" : l.status === "in_progress" ? "done" : "locked",
  }));
  if (!course) {
    return (
      <div className={embedded ? "" : "pt-[14px] pb-6"}>
        <div className="mt-3 rounded-[16px] border border-line bg-card px-5 py-8 text-center">
          <div className="text-[24px]">📚</div>
          <div className="mt-2 text-[14px] font-black text-ink">No course started yet</div>
          <div className="mt-1 text-[11px] font-bold text-ink-3">Pick one from Courses and your path builds itself as you go.</div>
          <Link href="/learn?tab=courses" className="inline-block mt-3 rounded-[12px] bg-green text-cream-text px-4 py-2 text-[12px] font-black">Browse courses</Link>
        </div>
      </div>
    );
  }
  return (
    <div className={embedded ? "" : "pt-[14px] pb-6"}>
      {!embedded && <div className="flex items-center justify-between"><h1 className="text-[21px] font-black text-ink">Learn</h1><span className="rounded-[18px] bg-orange-tint px-3 py-[5px] text-[12px] font-black text-orange-2">🔥 {streak} days</span></div>}
      <div className="mt-3 bg-card border border-line rounded-[16px] px-4 py-3">
        <Eyebrow>YOUR PATH</Eyebrow>
        <div className="flex justify-between items-baseline mt-1"><span className="text-[16px] font-black text-ink">{course.title}</span><span className="text-[11px] font-black text-green">{course.done} of {course.lessons}</span></div>
        <div className="flex gap-1 mt-2">{Array.from({ length: Math.max(1, course.lessons) }).map((_, i) => <span key={i} className={`flex-1 h-[6px] rounded-[4px] ${i < course.done ? "bg-green-2" : "bg-line-2"}`} />)}</div>
      </div>
      {next && (
        <Link href={`/lesson/${next.id}`} className="mt-3 rounded-[16px] border border-green-line px-4 py-3 flex items-center gap-3" style={{ background: "linear-gradient(105deg,#EAF2E3,#F1F7EB)" }}>
          <span className="w-10 h-10 rounded-[12px] bg-green-2 text-white flex items-center justify-center text-[16px]">▶</span>
          <div className="flex-1"><div className="text-[10px] font-black text-green">NEXT · LESSON {next.index}</div><div className="text-[15.5px] font-black text-ink">{next.title}</div><div className="text-[10.5px] font-bold text-ink-3">{next.minutes} min{next.hasQuiz ? " · quiz" : ""}</div></div>
        </Link>
      )}
      <Eyebrow className="mt-4 mb-2">THE PATH</Eyebrow>
      <div className="relative pl-1"><span className="absolute left-[14px] top-3 bottom-3 w-[2px] bg-line rounded" />
        {nodes.map((node) => <div key={node.key} className="relative flex items-center gap-3 py-[7px]">{icon(node.state)}<span className={`flex-1 text-[12.5px] font-bold ${node.state === "next" ? "text-ink font-black text-[13px]" : node.state === "locked" || node.state === "checkpoint" ? "text-ink-2" : "text-ink-3"}`}>{node.title}</span><span className={`text-[10px] font-black ${node.state === "next" ? "text-orange-2" : "text-green"}`}>{node.state === "mastered" ? "✓ mastered" : node.state === "done" ? "✓" : node.state === "next" ? "up next" : ""}</span></div>)}
      </div>
      {!embedded && <div className="flex gap-2 mt-4">{[["📚 Courses", "/learn?tab=courses"], ["🎥 Live", "/learn?tab=live"], ["🃏 Review", "/learn?tab=review"]].map(([l, h]) => <Link key={h} href={h} className="flex-1 bg-card border border-line rounded-[12px] py-[9px] text-center text-[11px] font-bold text-ink-2">{l}</Link>)}</div>}
    </div>
  );
}
