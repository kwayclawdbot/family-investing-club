"use client";
import { Toggle } from "@/components/ui/extras";
import { useLocal } from "@/components/profile/useLocal";

const ROWS = [
  ["kidsPost", "Kids can post in Club", "Off keeps young learners read-only in community spaces."],
  ["showProgress", "Show kids' progress to the whole family", "Everyone sees the weekly leaderboard."],
  ["weeklyEmail", "Weekly summary email", "One email each Sunday with every learner's progress."],
] as const;

export function ParentControls() {
  const [prefs, setPrefs] = useLocal("fic.family.prefs", { kidsPost: false, showProgress: true, weeklyEmail: true });
  return (
    <div className="bg-card border border-line rounded-card px-4 py-1">
      {ROWS.map(([k, label, sub], i) => (
        <div key={k} className={`flex items-center gap-3 py-3 ${i < ROWS.length - 1 ? "border-b border-paper-2" : ""}`}>
          <div className="flex-1">
            <div className="text-[13.5px] font-extrabold text-ink">{label}</div>
            <div className="text-[11.5px] font-bold text-ink-3">{sub}</div>
          </div>
          <Toggle checked={prefs[k]} onChange={(v) => setPrefs((p) => ({ ...p, [k]: v }))} label={label} />
        </div>
      ))}
    </div>
  );
}
