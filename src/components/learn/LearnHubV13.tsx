"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LearnV12 } from "@/components/learn/v12/LearnV12";
import { PracticeHub } from "@/components/practice/PracticeHub";
import { CashText } from "@/components/markets/v13/bits";
import { scenarioList } from "@/lib/content/scenarios";
import type { CourseDetail, LearnHubData } from "@/lib/learn/types";
import type { Game } from "@/lib/types";
import { Toggle } from "@/components/ui/extras";

const when = (iso: string) => {
  const d = new Date(iso);
  return { day: d.toLocaleDateString("en-US", { weekday: "short" }), time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) };
};

export type LearnTab = "path" | "courses" | "live" | "practice" | "review";
const TABS: [LearnTab, string][] = [["path", "Path"], ["courses", "Courses"], ["live", "Live"], ["practice", "Practice"], ["review", "Review"]];
const card = "bg-card border border-line rounded-[16px]";
const eyebrow = "mt-3 mb-[6px] text-[11px] font-black text-ink-3";

/** Learn — the LMS hub over the real curriculum: 12 published courses, live sessions, the member's
 *  own progress, review deck and weakest skills. Every list here is a table read (`getLearnHub`). */
export function LearnHubV13({ tab, portfolio, hub, course, games }: { tab: LearnTab; portfolio: { value: number; changePct: number; holdings: number; series: number[] }; hub: LearnHubData | null; course: CourseDetail | null; games: Game[] }) {
  const router = useRouter();
  const [remind, setRemind] = useState<Record<string, boolean>>({});
  const streak = hub?.streak ?? 0;
  const cont = hub?.continueLesson ?? null;
  // The shelf reads by who a course is for: the club's own programs first, then the wider library.
  const courses = hub?.courses ?? [];
  const coreCourses = courses.filter((c) => c.program === "fic");
  const electives = courses.filter((c) => c.program !== "fic");
  const liveNow = hub?.live.now[0] ?? null;
  const upcoming = hub?.live.upcoming ?? [];
  const recordings = hub?.live.recordings ?? [];
  const flashcardsDue = hub?.review.due ?? 0;
  const weak = hub?.review.weak ?? [];
  return (
    <div className="pt-[14px] pb-6">
      <div className="flex items-center justify-between"><h1 className="text-[21px] font-black text-ink">Learn</h1><span className="rounded-[18px] bg-orange-tint px-3 py-[5px] text-[12px] font-black text-orange-2">🔥 {streak} days</span></div>
      <div className="mt-[10px] flex gap-[3px] bg-[#F1EADB] rounded-[12px] p-[3px]" role="tablist">
        {TABS.map(([id, l]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => router.replace(id === "path" ? "/learn" : `/learn?tab=${id}`)} className={`flex-1 rounded-[9px] py-[6px] text-[10.5px] font-extrabold ${tab === id ? "bg-card text-ink shadow-sm" : "text-ink-3"}`}>{l}</button>)}
      </div>
      {tab === "path" && (
        <>
          <LearnV12 streak={streak} course={course} embedded />
          {cont && (
            <>
              <div className={eyebrow}>CONTINUE IN COURSES</div>
              <Link href={`/lesson/${cont.lessonId}`} className={`${card} flex items-center gap-3 px-4 py-3`}>
                <span className="w-10 h-10 rounded-[12px] bg-orange-tint text-orange-2 flex items-center justify-center text-[16px]">📊</span>
                <div className="flex-1"><div className="text-[10px] font-black text-orange-2">{cont.courseTitle.toUpperCase()} · {cont.pct}%</div><div className="text-[14px] font-black text-ink">{cont.title}</div><div className="text-[10.5px] font-bold text-ink-3">Lesson {cont.lessonNo} of {cont.lessonTotal} · {cont.minutes} min</div></div><span className="text-ink-4">›</span>
              </Link>
            </>
          )}
          {upcoming[0] && (
            <Link href={`/live/${upcoming[0].id}`} className={`${card} mt-2 flex items-center gap-3 px-4 py-3`}>
              <span className="rounded-[7px] bg-[#C96A57] text-cream-text px-2 py-[3px] text-[9.5px] font-black">● {when(upcoming[0].startsAt).day.toUpperCase()}</span>
              <div className="flex-1"><div className="text-[13px] font-black text-ink">{upcoming[0].title}</div><div className="text-[10.5px] font-bold text-ink-3">{when(upcoming[0].startsAt).time} · {upcoming[0].host}</div></div><span className="text-ink-4">›</span>
            </Link>
          )}
        </>
      )}
      {tab === "courses" && (
        <>
          {cont && (
            <Link href={`/lesson/${cont.lessonId}`} className="mt-3 block rounded-[16px] border border-green-line px-4 py-3" style={{ background: "linear-gradient(105deg,#EAF2E3,#F1F7EB)" }}>
              <div className="text-[10px] font-black text-green">CONTINUE · {cont.courseTitle.toUpperCase()}</div><div className="text-[15px] font-black text-ink">Lesson {cont.lessonNo} · {cont.title}</div><div className="text-[10.5px] font-bold text-ink-3">{cont.minutes} min</div>
            </Link>
          )}
          {!courses.length && <p className="mt-4 text-center text-[12px] font-bold text-ink-3">No courses published yet.</p>}
          {!!coreCourses.length && <div className={eyebrow}>THE CLUB CURRICULUM</div>}
          {!!coreCourses.length && <div className={`${card} px-4 py-1`}>{coreCourses.map((c, i) => (
            <Link key={c.slug} href={`/learn/path/${c.slug}`} className={`flex items-center gap-3 py-[10px] ${i < coreCourses.length - 1 ? "border-b border-paper-2" : ""}`}>
              <span className="w-9 h-9 rounded-[11px] bg-paper-2 flex items-center justify-center text-[16px]">📘</span>
              <div className="flex-1"><div className="text-[13.5px] font-black text-ink">{c.title}</div><div className="text-[10.5px] font-bold text-ink-3">{c.lessons} {c.lessons === 1 ? "lesson" : "lessons"}{c.modules ? ` · ${c.modules} modules` : ""}</div></div>
              <span className={`text-[11px] font-black ${c.pct === 100 ? "text-green" : c.pct > 0 ? "text-orange-2" : "text-ink-4"}`}>{c.pct > 0 ? `${c.pct}% complete` : "Start"}</span>
            </Link>))}</div>}
          {!!electives.length && <div className={eyebrow}>THE LIBRARY</div>}
          {!!electives.length && <div className={`${card} px-4 py-1`}>{electives.map((c, i) => (
            <Link key={c.slug} href={`/learn/path/${c.slug}`} className={`flex items-center gap-3 py-[10px] ${i < electives.length - 1 ? "border-b border-paper-2" : ""}`}>
              <span className="w-9 h-9 rounded-[11px] bg-paper-2 flex items-center justify-center text-[16px]">🎓</span>
              <div className="flex-1"><div className="text-[13.5px] font-black text-ink">{c.title}</div><div className="text-[10.5px] font-bold text-ink-3">{c.lessons} {c.lessons === 1 ? "lesson" : "lessons"}</div></div><span className="text-ink-4">›</span>
            </Link>))}</div>}
          <p className="mt-[9px] text-center text-[10px] font-bold text-ink-4">Finish a course → checkpoint badge + XP toward your next belt</p>
        </>
      )}
      {tab === "live" && (
        <>
          {liveNow && (
            <div className={`${card} mt-3 px-4 py-3`}>
              <div className="flex items-center justify-between"><span className="rounded-[7px] bg-[#C96A57] text-cream-text px-2 py-[3px] text-[9.5px] font-black">● LIVE NOW</span>{!!liveNow.viewers && <span className="text-[9.5px] font-extrabold text-ink-3">{liveNow.viewers} watching</span>}</div>
              <div className="mt-[6px] text-[15.5px] font-black text-ink">{liveNow.title}</div>
              <div className="flex items-center gap-2 mt-[6px]">
                <span className="w-[26px] h-[26px] rounded-full bg-green-3 text-white text-[10px] font-black flex items-center justify-center border-[2.5px] border-[#2E2A21] shadow-[0_0_0_2px_#FFFDF7]">{liveNow.host.charAt(0).toUpperCase()}</span>
                <span className="text-[11px] font-extrabold text-ink-2 truncate">{liveNow.host}{liveNow.hostTitle ? ` · ${liveNow.hostTitle}` : ""}</span>
                <Link href={`/live/${liveNow.id}`} className="ml-auto rounded-[10px] bg-[#C96A57] text-cream-text px-[14px] py-[7px] text-[11px] font-black">Join</Link>
              </div>
            </div>
          )}
          <div className={eyebrow}>UPCOMING</div>
          <div className={`${card} px-[14px] py-[3px]`}>
            {!upcoming.length && <p className="py-4 text-center text-[11.5px] font-bold text-ink-3">Nothing scheduled right now.</p>}
            {upcoming.map((u, i) => (
              <div key={u.id} className={`flex items-center gap-[10px] py-[10px] ${i < upcoming.length - 1 ? "border-b border-paper-2" : ""}`}>
                <span className="w-[38px] text-center"><span className="block text-[13px] font-black text-ink">{when(u.startsAt).day}</span><span className="block text-[9.5px] font-extrabold text-ink-3">{when(u.startsAt).time}</span></span>
                <Link href={`/live/${u.id}`} className="flex-1 min-w-0"><span className="block text-[13px] font-black text-ink truncate">{u.title}</span><span className="block text-[10px] font-bold text-ink-3 truncate">{u.host}{u.minutes ? ` · ${u.minutes} min` : ""}</span></Link>
                <span className="flex items-center gap-1 text-[10px] font-extrabold text-ink-3">Remind<Toggle checked={!!remind[u.id]} onChange={(v) => setRemind((r) => ({ ...r, [u.id]: v }))} label={`Remind me: ${u.title}`} /></span>
              </div>))}
          </div>
          {!!recordings.length && <div className={eyebrow}>RECORDINGS</div>}
          {!!recordings.length && <div className={`${card} px-[14px] py-[3px]`}>{recordings.map((r, i) => (
            <Link key={r.id} href={`/live/${r.id}`} className={`flex items-center gap-3 py-[10px] ${i < recordings.length - 1 ? "border-b border-paper-2" : ""}`}>
              <span className="w-9 h-9 rounded-[11px] bg-[#2E2A21] text-cream-text flex items-center justify-center text-[13px]">▶</span>
              <div className="flex-1 min-w-0"><div className="text-[13px] font-black text-ink truncate">{r.title}</div><div className="text-[10px] font-bold text-ink-3">{new Date(r.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{r.minutes ? ` · ${r.minutes} min` : ""}</div></div><span className="text-ink-4">›</span>
            </Link>))}</div>}
        </>
      )}
      {tab === "practice" && (
        <>
          <PracticeHub portfolio={portfolio} games={games} embedded />
          <div className={eyebrow}>SCENARIOS</div>
          <div className={`${card} px-[14px] py-[3px]`}>{scenarioList.map((s, i) => (
            <Link key={s.id} href={`/learn/scenarios/${s.id}`} className={`flex items-center gap-3 py-[10px] ${i < scenarioList.length - 1 ? "border-b border-paper-2" : ""}`}>
              <span className="w-9 h-9 rounded-[11px] bg-purple-tint flex items-center justify-center text-[16px]">{s.emoji}</span>
              <div className="flex-1"><div className="text-[13px] font-black text-ink">{s.title}</div><div className="text-[10px] font-bold text-ink-3"><CashText text={s.sub} /></div></div><span className="text-ink-4">›</span>
            </Link>))}</div>
        </>
      )}
      {tab === "review" && (
        <>
          <Link href="/learn/review" className="mt-3 block rounded-[16px] border border-purple-line px-4 py-4" style={{ background: "linear-gradient(105deg,#EFEBF8,#F7F3FC)" }}>
            <div className="text-[10px] font-black text-purple-2">DAILY REVIEW · {flashcardsDue} CARDS DUE</div><div className="text-[15.5px] font-black text-ink">Terms from lessons you&apos;ve completed + weak concepts</div><div className="mt-2 inline-block rounded-[10px] bg-purple-2 text-cream-text px-4 py-2 text-[12px] font-black">Start review · +5 XP</div>
          </Link>
          <div className={eyebrow}>WEAK CONCEPTS</div>
          <div className={`${card} px-4 py-1`}>
            {!weak.length && <p className="py-4 text-center text-[11.5px] font-bold text-ink-3">Nothing measured yet — finish a quiz and your weakest concepts show up here.</p>}
            {weak.map((k, i) => (
              <Link key={k.id} href="/learn/review" className={`flex items-center justify-between py-[10px] ${i < weak.length - 1 ? "border-b border-paper-2" : ""}`}>
                <span className="text-[13px] font-black text-ink">{k.name}</span><span className="text-[11px] font-black text-orange-2">{Math.round(k.score)}% mastered ›</span>
              </Link>))}
          </div>
        </>
      )}
    </div>
  );
}
