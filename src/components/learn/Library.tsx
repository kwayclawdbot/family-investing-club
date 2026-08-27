"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { LearningPath } from "@/lib/types";
import { LockIcon, SearchIcon } from "@/components/ui/icons";

const TABS = ["Core Path", "Electives", "Assigned"] as const;

function PathCard({ p, index }: { p: LearningPath; index: number }) {
  const badge = "w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0";
  const done = p.status === "done";
  const active = p.status === "active";
  const locked = p.status === "locked";
  const meta = done
    ? `${p.lessons} lessons · ${p.checkpoints} checkpoints`
    : active
    ? `${p.lessons} lessons · ${p.checkpoints} checkpoints · Lesson ${p.nextLesson} next`
    : locked && index === 2
    ? `${p.lessons} lessons · finish Foundations to unlock`
    : `${p.lessons} lessons · ${p.blurb.replace(/\.$/, "").replace(/^./, (c) => c.toLowerCase())}`;

  return (
    <Link
      href={`/learn/path/${p.slug}`}
      className={`block bg-card rounded-card px-4 py-[14px] ${
        active ? "border-2 border-orange" : "border border-line"
      } ${locked ? "opacity-[0.65]" : ""}`}
    >
      <div className="flex items-center gap-3">
        {done ? (
          <span className={`${badge} bg-green-2 text-white font-black text-[17px]`}>✓</span>
        ) : active ? (
          <span className={`${badge} bg-orange-tint text-orange-2 font-black text-[15px]`}>{index + 1}</span>
        ) : (
          <span className={`${badge} bg-line-2 text-ink-5`}>
            <LockIcon size={15} strokeWidth={2.4} />
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[14.5px] font-black text-ink">{p.title}</div>
          <div className="text-[11.5px] font-bold text-ink-3">{meta}</div>
        </div>
        {done && <span className="text-[12px] font-black text-green">100%</span>}
        {active && <span className="text-[12px] font-black text-orange-2">{p.progress}%</span>}
      </div>
      {(done || active) && (
        <div className="h-[6px] rounded-[3px] bg-line-2 mt-2 overflow-hidden">
          <div className={`h-full rounded-[3px] ${done ? "bg-green-2" : "bg-orange"}`} style={{ width: `${p.progress}%` }} />
        </div>
      )}
    </Link>
  );
}

function ElectiveCard({ p }: { p: LearningPath }) {
  return (
    <Link href={`/learn/path/${p.slug}`} className="flex-1 min-w-[150px] bg-card border border-line rounded-card px-[14px] py-[13px]">
      <span className="bg-purple-tint text-purple-2 rounded-[8px] px-[9px] py-[3px] text-[10px] font-black">ELECTIVE</span>
      <div className="mt-2 text-[13.5px] font-black text-ink">{p.title}</div>
      <div className="text-[11px] font-bold text-ink-3 mt-[2px]">{p.lessons} lessons</div>
    </Link>
  );
}

export function Library({ paths }: { paths: LearningPath[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Core Path");
  const [q, setQ] = useState("");
  const core = useMemo(() => paths.filter((p) => !p.elective), [paths]);
  const electives = useMemo(() => paths.filter((p) => p.elective), [paths]);
  const filter = (list: LearningPath[]) =>
    q.trim() ? list.filter((p) => (p.title + " " + p.blurb).toLowerCase().includes(q.toLowerCase())) : list;

  return (
    <>
      <label className="mt-3 flex items-center gap-[9px] bg-card border border-line rounded-[14px] px-[14px] py-[10px]">
        <SearchIcon className="text-ink-4 shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search lessons, concepts, paths…"
          className="flex-1 bg-transparent outline-none text-[13px] font-bold text-ink placeholder:text-ink-4"
        />
      </label>

      <div className="flex gap-[7px] mt-3" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-[10px] px-[15px] py-[7px] text-[12.5px] ${
              tab === t ? "bg-green-2 text-cream-text font-black" : "bg-card border border-line text-ink-3 font-extrabold"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Core Path" && (
        <>
          <div className="flex flex-col gap-[9px] mt-3">
            {filter(core).map((p, i) => (
              <PathCard key={p.slug} p={p} index={i} />
            ))}
          </div>
          <div className="mt-[14px] mb-2 flex items-center justify-between">
            <span className="text-[15px] font-black text-ink">Electives</span>
            <button onClick={() => setTab("Electives")} className="text-[12px] font-extrabold text-green">
              See all
            </button>
          </div>
          <div className="flex gap-[9px] overflow-x-auto no-scrollbar">
            {electives.map((p) => (
              <ElectiveCard key={p.slug} p={p} />
            ))}
          </div>
        </>
      )}

      {tab === "Electives" && (
        <div className="flex flex-col gap-[9px] mt-3">
          {filter(electives).map((p) => (
            <Link key={p.slug} href={`/learn/path/${p.slug}`} className="bg-card border border-line rounded-card px-4 py-[14px]">
              <span className="bg-purple-tint text-purple-2 rounded-[8px] px-[9px] py-[3px] text-[10px] font-black">ELECTIVE</span>
              <div className="mt-2 text-[14.5px] font-black text-ink">{p.title}</div>
              <div className="text-[11.5px] font-bold text-ink-3">
                {p.lessons} lessons · {p.blurb}
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "Assigned" && (
        <div className="mt-6 bg-card border border-line rounded-card px-4 py-6 text-center">
          <div className="text-[28px]">📋</div>
          <div className="mt-2 text-[14.5px] font-black text-ink">Nothing assigned yet</div>
          <div className="mt-1 text-[12px] font-bold text-ink-3">
            Lessons your family, class or coach assigns will show up here.
          </div>
        </div>
      )}
    </>
  );
}
