"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onboardingOptions } from "@/lib/data";
import { StepShell, Title, Subtitle, Cta } from "./StepShell";
import { readAnswers, writeAnswers, nextStep } from "./store";

/** Club goals (Product Shift §6) lead; learning goals follow. */
const CLUB_GOALS = ["Pick stocks together", "Research companies together", "Build a family portfolio", "Learn with my kids", "Meet other investors"];
const DEFAULTS = ["Pick stocks together", "Research companies together", "Invest with confidence"];

export function GoalsStep() {
  const router = useRouter();
  const [goals, setGoals] = useState<string[]>(DEFAULTS);
  const [creating, setCreating] = useState(true);
  useEffect(() => {
    const a = readAnswers();
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate from localStorage after mount */
    if (a.goals) setGoals(a.goals);
    setCreating(a.who !== "join" && a.who !== "explore");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function toggle(g: string) {
    setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));
  }
  function next() {
    writeAnswers({ goals });
    router.push(nextStep("goals"));
  }
  const all = [...CLUB_GOALS, ...onboardingOptions.goals.filter((g) => !CLUB_GOALS.includes(g))];

  return (
    <StepShell step="goals" creating={creating} cta={<Cta onClick={next}>Continue</Cta>}>
      <Title>What do you want from FIC?</Title>
      <Subtitle>Pick as many as you like — this shapes your club prompts and your skill plan.</Subtitle>
      <div className="flex flex-wrap gap-[9px] mt-5">
        {all.map((g) => {
          const on = goals.includes(g);
          return (
            <button
              key={g}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(g)}
              className={`rounded-[22px] px-4 py-[10px] text-[13.5px] font-extrabold ${
                on ? "bg-green-tint border-2 border-green-2 text-ink" : "bg-card border-[1.5px] border-line text-ink-2"
              }`}
            >
              {on ? "✓ " : ""}
              {g}
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
