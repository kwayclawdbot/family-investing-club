"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onboardingOptions } from "@/lib/data";
import { StepShell, Title, Subtitle, Cta } from "./StepShell";
import { readAnswers, writeAnswers, nextStep } from "./store";

const DEFAULTS = ["Understand money basics", "Invest with confidence", "Build a weekly family habit"];

export function GoalsStep() {
  const router = useRouter();
  const [goals, setGoals] = useState<string[]>(DEFAULTS);
  useEffect(() => {
    const g = readAnswers().goals;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount (no SSR mismatch)
    if (g) setGoals(g);
  }, []);

  function toggle(g: string) {
    setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));
  }
  function next() {
    writeAnswers({ goals });
    router.push(nextStep("goals"));
  }

  return (
    <StepShell step="goals" cta={<Cta onClick={next}>Continue</Cta>}>
      <Title>What do you want from FIC?</Title>
      <Subtitle>Pick as many as you like — this shapes your path.</Subtitle>
      <div className="flex flex-wrap gap-[9px] mt-5">
        {onboardingOptions.goals.map((g) => {
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
