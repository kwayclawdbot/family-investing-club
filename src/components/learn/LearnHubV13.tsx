"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LearnV12 } from "@/components/learn/v12/LearnV12";
import { PracticeHub } from "@/components/practice/PracticeHub";
import { myPerf, liveNow, upcoming, recordings, continueCourse, liveThu, scenarioList, coreCourses, electives } from "@/lib/fixtures/v13-learn";
import { Toggle } from "@/components/ui/extras";

export type LearnTab = "path" | "courses" | "live" | "practice" | "review";
const TABS: [LearnTab, string][] = [["path", "Path"], ["courses", "Courses"], ["live", "Live"], ["practice", "Practice"], ["review", "Review"]];
const card = "bg-card border border-line rounded-[16px]";
const eyebrow = "mt-3 mb-[6px] text-[11px] font-black text-ink-3";

export function LearnHubV13({ tab, streak, portfolio, flashcardsDue = 8 }: { tab: LearnTab; streak: number; portfolio: { value: number; changePct: number; holdings: number; series: number[] }; flashcardsDue?: number }) {
  const router = useRouter();
  const [remind, setRemind] = useState<Record<string, boolean>>({});
  void myPerf;
  return (
    <div className="pt-[14px] pb-6">
      <div className="flex items-center justify-between"><h1 className="text-[21px] font-black text-ink">Learn</h1><span className="rounded-[18px] bg-orange-tint px-3 py-[5px] text-[12px] font-black text-orange-2">🔥 {streak} days</span></div>
      <div className="mt-[10px] flex gap-[3px] bg-[#F1EADB] rounded-[12px] p-[3px]" role="tablist">
        {TABS.map(([id, l]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => router.replace(id === "path" ? "/learn" : `/learn?tab=${id}`)} className={`flex-1 rounded-[9px] py-[6px] text-[10.5px] font-extrabold ${tab === id ? "bg-card text-ink shadow-sm" : "text-ink-3"}`}>{l}</button>)}
      </div>
      {tab === "path" && (
        <>
          <LearnV12 streak={streak} embedded />
          <div className={eyebrow}>CONTINUE IN COURSES</div>
          <Link href={`/learn/path/${continueCourse.slug}`} className={`${card} flex items-center gap-3 px-4 py-3`}>
            <span className="w-10 h-10 rounded-[12px] bg-orange-tint text-orange-2 flex items-center justify-center text-[16px]">📊</span>
            <div className="flex-1"><div className="text-[10px] font-black text-orange-2">COURSE · {continueCourse.pct}%</div><div className="text-[14px] font-black text-ink">{continueCourse.title}</div></div><span className="text-ink-4">›</span>
          </Link>
          <Link href={`/live/${liveThu.id}`} className={`${card} mt-2 flex items-center gap-3 px-4 py-3`}>
            <span className="rounded-[7px] bg-[#C96A57] text-cream-text px-2 py-[3px] text-[9.5px] font-black">● LIVE THU</span>
            <div className="flex-1"><div className="text-[13px] font-black text-ink">{liveThu.title}</div><div className="text-[10.5px] font-bold text-ink-3">{liveThu.sub}</div></div><span className="text-ink-4">›</span>
          </Link>
        </>
      )}
      {tab === "courses" && (
        <>
          <Link href="/lesson/valuation" className="mt-3 block rounded-[16px] border border-green-line px-4 py-3" style={{ background: "linear-gradient(105deg,#EAF2E3,#F1F7EB)" }}>
            <div className="text-[10px] font-black text-green">CONTINUE · INVESTING FOUNDATIONS</div><div className="text-[15px] font-black text-ink">Lesson 7 · Understanding Valuation</div><div className="text-[10.5px] font-bold text-ink-3">5 min</div>
          </Link>
          <div className={eyebrow}>CORE CURRICULUM</div>
          <div className={`${card} px-4 py-1`}>{coreCourses.map((c, i) => (
            <Link key={c.slug} href={`/learn/path/${c.slug}`} className={`flex items-center gap-3 py-[10px] ${i < coreCourses.length - 1 ? "border-b border-paper-2" : ""} ${c.locked ? "opacity-70" : ""}`}>
              <span className="w-9 h-9 rounded-[11px] bg-paper-2 flex items-center justify-center text-[16px]">{c.emoji}</span>
              <div className="flex-1"><div className="text-[13.5px] font-black text-ink">{c.title}</div><div className="text-[10.5px] font-bold text-ink-3">{c.sub}</div></div>
              <span className={`text-[11px] font-black ${c.locked ? "text-ink-4" : c.pct === 100 ? "text-green" : "text-orange-2"}`}>{c.locked ? `🔒 ${c.locked}` : `${c.pct}% complete`}</span>
            </Link>))}</div>
          <div className={eyebrow}>ELECTIVES</div>
          <div className={`${card} px-4 py-1`}>{electives.map((c, i) => (
            <Link key={c.slug} href={`/learn/path/${c.slug}`} className={`flex items-center gap-3 py-[10px] ${i < electives.length - 1 ? "border-b border-paper-2" : ""}`}>
              <span className="w-9 h-9 rounded-[11px] bg-paper-2 flex items-center justify-center text-[16px]">{c.emoji}</span>
              <div className="flex-1"><div className="text-[13.5px] font-black text-ink">{c.title}</div><div className="text-[10.5px] font-bold text-ink-3">{c.sub}</div></div><span className="text-ink-4">›</span>
            </Link>))}</div>
        </>
      )}
      {tab === "live" && (
        <>
          <div className={`${card} mt-3 px-4 py-3`}>
            <div className="flex items-center justify-between"><span className="rounded-[7px] bg-[#C96A57] text-cream-text px-2 py-[3px] text-[9.5px] font-black">● LIVE NOW</span><span className="text-[9.5px] font-extrabold text-ink-3">{liveNow.watching} watching</span></div>
            <div className="mt-[6px] text-[15.5px] font-black text-ink">{liveNow.title}</div>
            <div className="flex items-center gap-2 mt-[6px]">
              <span className="w-[26px] h-[26px] rounded-full bg-green-3 text-white text-[10px] font-black flex items-center justify-center border-[2.5px] border-[#2E2A21] shadow-[0_0_0_2px_#FFFDF7]">D</span>
              <span className="text-[11px] font-extrabold text-ink-2">{liveNow.host} · {liveNow.hostBelt} · {liveNow.sub}</span>
              <Link href={`/live/${liveNow.id}`} className="ml-auto rounded-[10px] bg-[#C96A57] text-cream-text px-[14px] py-[7px] text-[11px] font-black">Join</Link>
            </div>
          </div>
          <div className={eyebrow}>UPCOMING THIS WEEK</div>
          <div className={`${card} px-[14px] py-[3px]`}>{upcoming.map((u, i) => (
            <div key={u.id} className={`flex items-center gap-[10px] py-[10px] ${i < upcoming.length - 1 ? "border-b border-paper-2" : ""}`}>
              <span className="w-[38px] text-center"><div className="text-[13px] font-black text-ink">{u.day}</div><div className="text-[9.5px] font-extrabold text-ink-3">{u.time}</div></span>
              <Link href={`/live/${u.id}`} className="flex-1"><div className="text-[13px] font-black text-ink">{u.title}</div><div className="text-[10px] font-bold text-ink-3">{u.sub}</div></Link>
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-ink-3">Remind<Toggle checked={!!remind[u.id]} onChange={(v) => setRemind((r) => ({ ...r, [u.id]: v }))} label={`Remind me: ${u.title}`} /></span>
            </div>))}</div>
          <div className={eyebrow}>RECORDINGS</div>
          <div className={`${card} px-[14px] py-[3px]`}>{recordings.map((r, i) => (
            <Link key={r.id} href={`/live/${r.id}`} className={`flex items-center gap-3 py-[10px] ${i < recordings.length - 1 ? "border-b border-paper-2" : ""}`}>
              <span className="w-9 h-9 rounded-[11px] bg-[#2E2A21] text-cream-text flex items-center justify-center text-[13px]">▶</span>
              <div className="flex-1"><div className="text-[13px] font-black text-ink">{r.title}</div><div className="text-[10px] font-bold text-ink-3">{r.sub}</div></div><span className="text-ink-4">›</span>
            </Link>))}</div>
        </>
      )}
      {tab === "practice" && (
        <>
          <PracticeHub portfolio={portfolio} embedded />
          <div className={eyebrow}>SCENARIOS</div>
          <div className={`${card} px-[14px] py-[3px]`}>{scenarioList.map((s, i) => (
            <Link key={s.id} href={`/learn/scenarios/${s.id}`} className={`flex items-center gap-3 py-[10px] ${i < scenarioList.length - 1 ? "border-b border-paper-2" : ""}`}>
              <span className="w-9 h-9 rounded-[11px] bg-purple-tint flex items-center justify-center text-[16px]">{s.emoji}</span>
              <div className="flex-1"><div className="text-[13px] font-black text-ink">{s.title}</div><div className="text-[10px] font-bold text-ink-3">{s.sub}</div></div><span className="text-ink-4">›</span>
            </Link>))}</div>
        </>
      )}
      {tab === "review" && (
        <>
          <Link href="/learn/review" className="mt-3 block rounded-[16px] border border-purple-line px-4 py-4" style={{ background: "linear-gradient(105deg,#EFEBF8,#F7F3FC)" }}>
            <div className="text-[10px] font-black text-purple-2">DAILY REVIEW · {flashcardsDue} CARDS DUE</div><div className="text-[15.5px] font-black text-ink">Terms from lessons you&apos;ve completed + weak concepts</div><div className="mt-2 inline-block rounded-[10px] bg-purple-2 text-cream-text px-4 py-2 text-[12px] font-black">Start review · +5 XP</div>
          </Link>
          <div className={eyebrow}>WEAK CONCEPTS</div>
          <div className={`${card} px-4 py-1`}>{[["Valuation", "38%", "/lesson/valuation"], ["Position sizing", "62%", "/learn/path/build-a-portfolio"], ["Dividends", "74%", "/learn/path/investing-foundations"]].map(([t, p, h], i, a) => (
            <Link key={t} href={h} className={`flex items-center justify-between py-[10px] ${i < a.length - 1 ? "border-b border-paper-2" : ""}`}><span className="text-[13px] font-black text-ink">{t}</span><span className="text-[11px] font-black text-orange-2">{p} mastered ›</span></Link>))}</div>
        </>
      )}
    </div>
  );
}
