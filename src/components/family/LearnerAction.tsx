"use client";
import { useState } from "react";
import { useLocal } from "@/components/profile/useLocal";

/** The one-tap row under each learner (artboard 28): "Assign review" / "Cheer". Persists to fic.tasks.<id> / fic.cheers. */
export function LearnerAction({ learnerId, text, action, taskTitle }: { learnerId: string; text: string; action: "assign" | "cheer"; taskTitle?: string }) {
  const [tasks, setTasks] = useLocal<{ title: string; done: boolean }[]>(`fic.tasks.${learnerId}`, []);
  const [cheers, setCheers] = useLocal<Record<string, number>>("fic.cheers", {});
  const [done, setDone] = useState(false);
  const already = action === "assign" ? tasks.some((t) => t.title === taskTitle) : (cheers[learnerId] ?? 0) > 0;

  function go() {
    if (action === "assign" && taskTitle) setTasks((t) => (t.some((x) => x.title === taskTitle) ? t : [...t, { title: taskTitle, done: false }]));
    if (action === "cheer") setCheers((c) => ({ ...c, [learnerId]: (c[learnerId] ?? 0) + 1 }));
    setDone(true);
  }
  const label = action === "assign" ? (done || already ? "Assigned ✓" : "Assign review") : done || already ? "Cheered 🎉" : "Cheer";
  return (
    <div className="mt-[9px] flex items-center gap-2 bg-paper border border-line rounded-[11px] px-3 py-2">
      <span className="flex-1 text-[11.5px] font-bold text-ink-2">{text}</span>
      <button
        type="button"
        onClick={go}
        disabled={done || already}
        className={`rounded-[9px] px-[10px] py-[5px] text-[10.5px] font-black ${done || already ? "bg-green-tint text-green" : "bg-orange text-cream-text"}`}
      >
        {label}
      </button>
    </div>
  );
}
