"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onboardingOptions } from "@/lib/data";
import { StepShell, Title, Subtitle, Cta, OptionCard } from "./StepShell";
import { readAnswers, writeAnswers, nextStep } from "./store";

export function DailyStep() {
  const router = useRouter();
  const [minutes, setMinutes] = useState<number | null>(10);
  const [reminder, setReminder] = useState(true);
  const [weekly, setWeekly] = useState(true);
  const [creating, setCreating] = useState(true);
  useEffect(() => {
    const a = readAnswers();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setCreating(a.who !== "join" && a.who !== "explore");
     
    if (typeof a.weeklyHabit === "boolean") setWeekly(a.weeklyHabit);
     
    if (a.daily) setMinutes(a.daily);
     
    if (typeof a.reminder === "boolean") setReminder(a.reminder);
  }, []);

  function next() {
    writeAnswers({ daily: minutes, reminder, weeklyHabit: weekly });
    router.push(nextStep("daily"));
  }
  function skip() {
    writeAnswers({ daily: null, reminder: false, weeklyHabit: weekly });
    router.push(nextStep("daily"));
  }

  return (
    <StepShell step="daily" creating={creating} cta={<><Cta onClick={next}>Continue</Cta><button type="button" onClick={skip} className="block w-full mt-3 text-center text-[13px] font-extrabold text-ink-4">Skip for now — learn as you invest</button></>}>
      <Title>Set your daily goal</Title>
      <Subtitle>Optional. Small and steady beats big and rarely.</Subtitle>
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
      <div className="mt-4 bg-orange-tint border border-orange-line rounded-[14px] px-4 py-[13px] flex items-center justify-between">
        <div>
          <div className="text-[14px] font-extrabold text-ink">Weekly club habit</div>
          <div className="text-[12px] font-bold text-orange-2">Family Investing Night · Thu 7 PM</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={weekly}
          aria-label="Weekly club habit"
          onClick={() => setWeekly((w) => !w)}
          className={`relative w-[46px] h-7 rounded-[15px] transition shrink-0 ${weekly ? "bg-green-2" : "bg-line-3"}`}
        >
          <span className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-all ${weekly ? "right-[3px]" : "left-[3px]"}`} />
        </button>
      </div>
      <div className="mt-[10px] bg-card border border-line rounded-[14px] px-4 py-[13px] flex items-center justify-between">
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
