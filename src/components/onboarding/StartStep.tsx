"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onboardingOptions } from "@/lib/data";
import type { ExplanationLevel } from "@/lib/types";
import { StepShell, Title, Subtitle, Cta, OptionCard } from "./StepShell";
import { readAnswers, writeAnswers, nextStep, type OnboardingAnswers } from "./store";

type Start = NonNullable<OnboardingAnswers["start"]>;
const LEVELS: ExplanationLevel[] = ["Explorer", "Builder", "Investor", "Trader"];
const YOUTH: ExplanationLevel[] = ["Explorer", "Builder"];

export function StartStep() {
  const router = useRouter();
  const [value, setValue] = useState<Start>("new");
  const [level, setLevel] = useState<ExplanationLevel>("Investor");
  const [isFamily, setIsFamily] = useState(false);

  useEffect(() => {
    const a = readAnswers();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount (no SSR mismatch)
    if (a.start) setValue(a.start);
     
    if (a.level) setLevel(a.level);
     
    setIsFamily(a.who === "family");
  }, []);

  function pick(id: Start) {
    setValue(id);
    const opt = onboardingOptions.start.find((o) => o.id === id);
    if (opt) setLevel(opt.level);
  }
  function next() {
    writeAnswers({ start: value, level });
    router.push(nextStep("start"));
  }

  return (
    <StepShell step="start" cta={<Cta onClick={next}>Continue</Cta>}>
      <Title>Where are you starting from?</Title>
      <Subtitle>This sets how we explain things — change it anytime in Profile.</Subtitle>
      <div role="radiogroup" className="flex flex-col gap-[10px] mt-5">
        {onboardingOptions.start.map((o) => (
          <OptionCard key={o.id} title={o.title} sub={o.sub} selected={value === o.id} onSelect={() => pick(o.id as Start)} />
        ))}
      </div>
      <div className="mt-[18px] text-[12px] font-extrabold text-ink-3">YOUR EXPLANATION LEVEL</div>
      <div className="flex flex-wrap gap-[7px] mt-2" role="radiogroup" aria-label="Explanation level">
        {LEVELS.map((l) => {
          const youthLocked = YOUTH.includes(l) && !isFamily;
          const active = level === l;
          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={youthLocked}
              title={youthLocked ? "Youth levels are available for family members" : undefined}
              onClick={() => setLevel(l)}
              className={`rounded-[10px] px-[13px] py-[7px] text-[12px] ${
                active ? "bg-green-2 text-cream-text font-black" : "bg-card border border-line text-ink-4 font-extrabold"
              } ${youthLocked ? "opacity-70" : ""}`}
            >
              {l}
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
