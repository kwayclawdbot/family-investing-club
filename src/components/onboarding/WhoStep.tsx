"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onboardingOptions } from "@/lib/data";
import { StepShell, Title, Subtitle, Cta, OptionCard } from "./StepShell";
import { readAnswers, writeAnswers, nextStep, type OnboardingAnswers } from "./store";

type Who = NonNullable<OnboardingAnswers["who"]>;

export function WhoStep() {
  const router = useRouter();
  const [value, setValue] = useState<Who>("me");
  useEffect(() => {
    const w = readAnswers().who;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount (no SSR mismatch)
    if (w) setValue(w);
  }, []);

  function next() {
    writeAnswers({ who: value });
    router.push(nextStep("who"));
  }

  return (
    <StepShell step="who" cta={<Cta onClick={next}>Continue</Cta>}>
      <Title>Who&apos;s learning?</Title>
      <Subtitle>You can add family members anytime.</Subtitle>
      <div role="radiogroup" className="flex flex-col gap-[10px] mt-5">
        {onboardingOptions.who.map((o) => (
          <OptionCard key={o.id} title={o.title} sub={o.sub} selected={value === o.id} onSelect={() => setValue(o.id as Who)} />
        ))}
      </div>
      <div className="mt-4 bg-card border border-line rounded-[14px] px-[15px] py-3 flex items-center gap-[10px]">
        <span className="text-[18px]" aria-hidden>👨‍👩‍👧‍👦</span>
        <p className="text-[12.5px] font-bold text-ink-2 leading-[1.45]">
          Families with 2+ active members are <b className="text-green">3× more likely</b> to keep their learning streak.
        </p>
      </div>
    </StepShell>
  );
}
