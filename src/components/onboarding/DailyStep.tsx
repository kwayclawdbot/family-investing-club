"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onboardingOptions } from "@/lib/data";
import { StepShell, Title, Subtitle, Cta, OptionCard } from "./StepShell";
import { readAnswers, writeAnswers, nextStep } from "./store";

export function DailyStep() {
  const router = useRouter();
  const [minutes, setMinutes] = useState(10);
  const [reminder, setReminder] = useState(true);
  useEffect(() => {
    const a = readAnswers();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount (no SSR mismatch)
    if (a.daily) setMinutes(a.daily);
     
    if (typeof a.reminder === "boolean") setReminder(a.reminder);
  }, []);

  function next() {
    writeAnswers({ daily: minutes, reminder });
    router.push(nextStep("daily"));
  }

  return (
    <StepShell step="daily" cta={<Cta onClick={next}>Continue</Cta>}>
      <Title>Set your daily goal</Title>
      <Subtitle>Small and steady beats big and rarely.</Subtitle>
      <div role="radiogroup" className="flex flex-col gap-[10px] mt-5">
        {onboardingOptions.daily.map((d) => {
          const on = minutes === d.min;
          return (
            <OptionCard
              key={d.min}
              padding="py-[13px] px-4"
              title={d.label}
              sub={`${d.min} min / day · ${d.xp} XP`}
              selected={on}
              onSelect={() => setMinutes(d.min)}
              leading={
                <span
                  className={`w-11 h-11 rounded-[12px] flex items-center justify-center font-black text-[15px] shrink-0 ${
                    on ? "bg-green-tint text-green" : "bg-line-2 text-ink-3"
                  }`}
                >
                  {d.min}
                </span>
              }
            />
          );
        })}
      </div>
      <div className="mt-4 bg-card border border-line rounded-[14px] px-4 py-[13px] flex items-center justify-between">
        <div>
          <div className="text-[14px] font-extrabold text-ink">Daily reminder</div>
          <div className="text-[12px] font-bold text-ink-3">7:00 PM — after dinner works best for families</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={reminder}
          aria-label="Daily reminder"
          onClick={() => setReminder((r) => !r)}
          className={`relative w-[46px] h-7 rounded-[15px] transition shrink-0 ${reminder ? "bg-green-2" : "bg-line-3"}`}
        >
          <span
            className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-all ${reminder ? "right-[3px]" : "left-[3px]"}`}
          />
        </button>
      </div>
    </StepShell>
  );
}
