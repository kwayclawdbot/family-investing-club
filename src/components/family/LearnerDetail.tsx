"use client";
import { useState } from "react";
import type { ExplanationLevel, FamilyLearner } from "@/lib/types";
import { Avatar, ProgressBar, Tag, cx } from "@/components/ui";
import { Toggle, StatTile } from "@/components/ui/extras";
import { useLocal } from "@/components/profile/useLocal";

const LEVELS: ExplanationLevel[] = ["Explorer", "Builder", "Investor", "Trader"];
const ROLE: Record<string, { label: string; tone: "green" | "orange" | "purple" }> = {
  parent: { label: "Parent", tone: "green" }, teen: { label: "Teen", tone: "purple" }, child: { label: "Child", tone: "orange" },
};

type Task = { title: string; done: boolean };

export function LearnerDetail({ learner }: { learner: FamilyLearner }) {
  const [tasks, setTasks] = useLocal<Task[]>(`fic.tasks.${learner.id}`, learner.tasks);
  const [level, setLevel] = useLocal<ExplanationLevel>(`fic.level.${learner.id}`, learner.level);
  const [guard, setGuard] = useLocal(`fic.guard.${learner.id}`, { ageFilter: true, clubVisibility: "family" });
  const [openLevel, setOpenLevel] = useState(false);
  const [assigned, setAssigned] = useState<string | null>(null);
  const isYouth = learner.role !== "parent";

  function assign(concept: string) {
    const title = `Review: ${concept}`;
    if (!tasks.some((t) => t.title === title)) setTasks((t) => [...t, { title, done: false }]);
    setAssigned(concept);
    setTimeout(() => setAssigned(null), 1500);
  }

  return (
    <div className="pb-6">
      <div className="flex items-center gap-[14px]">
        <Avatar name={learner.name} color={learner.color} size={56} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-black text-ink">{learner.name}</h1>
            <Tag tone={ROLE[learner.role].tone}>{ROLE[learner.role].label}</Tag>
          </div>
          <div className="text-[12px] font-bold text-ink-3">{level} level · active {learner.lastActive.toLowerCase()}</div>
        </div>
      </div>
      {isYouth && (
        <p className="mt-2 text-[11.5px] font-bold text-ink-4">You&apos;re viewing {learner.name}&apos;s progress, not {learner.role === "child" ? "her" : "their"} account.</p>
      )}

      <div className="mt-3 flex gap-[9px]">
        <StatTile value={`🔥 ${learner.streak}`} label="day streak" />
        <StatTile value={learner.weekXp} label="XP this week" tone="green" />
        <StatTile value={`${learner.pathProgress}%`} label="path done" tone="orange" />
      </div>

      <div className="mt-3 bg-card border border-line rounded-card px-4 py-[13px]">
        <div className="text-[11px] font-black text-orange tracking-[0.5px]">CURRENT PATH</div>
        <div className="mt-1 text-[15px] font-black text-ink">{learner.pathTitle}</div>
        <ProgressBar value={learner.pathProgress} className="mt-2" />
        <div className="mt-[6px] text-[11.5px] font-bold text-ink-3">{learner.pathProgress}% complete</div>
      </div>

      <h2 className="mt-4 mb-2 text-[15px] font-black text-ink">Needs practice</h2>
      {learner.needs.length === 0 ? (
        <div className="bg-green-tint border border-green-line rounded-card px-4 py-3 text-[13px] font-bold text-green">No weak concepts right now — nice.</div>
      ) : (
        <div className="bg-card border border-line rounded-card px-4 py-1">
          {learner.needs.map((n, i) => (
            <div key={n} className={cx("flex items-center gap-3 py-3", i < learner.needs.length - 1 && "border-b border-paper-2")}>
              <span className="w-8 h-8 rounded-[10px] bg-orange-tint text-orange-2 flex items-center justify-center text-[14px]">📝</span>
              <span className="flex-1 text-[13.5px] font-extrabold text-ink">{n}</span>
              <button onClick={() => assign(n)} className="h-[30px] px-3 rounded-[10px] bg-green text-cream-text text-[12px] font-black">
                {assigned === n ? "Assigned ✓" : "Assign a review"}
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-4 mb-2 text-[15px] font-black text-ink">Assigned family tasks</h2>
      {tasks.length === 0 ? (
        <div className="bg-card border border-line rounded-card px-4 py-4 text-center text-[13px] font-bold text-ink-3">Nothing assigned yet.</div>
      ) : (
        <div className="bg-card border border-line rounded-card px-4 py-1">
          {tasks.map((t, i) => (
            <label key={t.title} className={cx("flex items-center gap-3 py-3", i < tasks.length - 1 && "border-b border-paper-2")}>
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => setTasks((all) => all.map((x) => (x.title === t.title ? { ...x, done: !x.done } : x)))}
                className="w-5 h-5 accent-[#4C8C4A]"
              />
              <span className={cx("text-[13.5px] font-extrabold", t.done ? "text-ink-4 line-through" : "text-ink")}>{t.title}</span>
            </label>
          ))}
        </div>
      )}

      <div className="mt-4 bg-card border border-line rounded-card px-4 py-1">
        <button className="w-full flex items-center justify-between py-3" onClick={() => setOpenLevel((o) => !o)} aria-expanded={openLevel}>
          <span className="text-[13.5px] font-extrabold text-ink">Explanation level</span>
          <span className="text-[12.5px] font-extrabold text-ink-3">{level} {openLevel ? "⌄" : "›"}</span>
        </button>
        {openLevel && (
          <div className="pb-3 flex gap-[6px]" role="radiogroup" aria-label="Explanation level">
            {LEVELS.map((l) => (
              <button key={l} role="radio" aria-checked={level === l} onClick={() => { setLevel(l); setOpenLevel(false); }}
                className={cx("flex-1 h-[32px] rounded-[10px] text-[11.5px] font-extrabold", level === l ? "bg-green text-cream-text" : "bg-paper border border-line text-ink-3")}>
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {isYouth && (
        <div className="mt-3 bg-purple-tint border border-purple-line rounded-card px-4 py-[13px]">
          <div className="text-[11px] font-black text-purple-2 tracking-[0.5px]">GUARDIAN CONTROLS</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-[13px] font-extrabold text-ink">Age-appropriate content only</div>
              <div className="text-[11.5px] font-bold text-ink-3">Hides trading and options paths.</div>
            </div>
            <Toggle checked={guard.ageFilter} onChange={(v) => setGuard((g) => ({ ...g, ageFilter: v }))} label="Age-appropriate content only" />
          </div>
          <div className="mt-3">
            <div className="text-[13px] font-extrabold text-ink">Club visibility</div>
            <div className="mt-[6px] flex gap-[6px]">
              {[["family", "Family only"], ["class", "Family + class"], ["read", "Read-only Club"]].map(([v, l]) => (
                <button key={v} onClick={() => setGuard((g) => ({ ...g, clubVisibility: v }))}
                  className={cx("flex-1 h-[32px] rounded-[10px] text-[11px] font-extrabold", guard.clubVisibility === v ? "bg-purple-2 text-cream-text" : "bg-card border border-purple-line text-ink-3")}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
