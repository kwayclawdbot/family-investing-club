"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepShell, Title, Subtitle, Cta, OptionCard } from "./StepShell";
import { readAnswers, writeAnswers, nextStep, type OnboardingAnswers } from "./store";

type Who = NonNullable<OnboardingAnswers["who"]>;
/** Prototype v2 `onboard2` — Who are you investing with? */
const OPTIONS: { id: Who; title: string; sub: string; kind?: "family" | "mixed" }[] = [
  { id: "explore", title: "Just me for now", sub: "Start solo — create a club anytime" },
  { id: "create", title: "My family & friends", sub: "Shared picks, votes, research & a club portfolio", kind: "family" },
  { id: "join", title: "My class or group", sub: "For educators and organizations", kind: "mixed" },
];

export function WhoStep() {
  const router = useRouter();
  const [value, setValue] = useState<Who>("create");
  useEffect(() => {
    const w = readAnswers().who;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    if (w) setValue(w);
  }, []);
  const creating = value !== "explore";
  function next() {
    const opt = OPTIONS.find((o) => o.id === value);
    writeAnswers({ who: value === "join" ? "create" : value, clubKind: opt?.kind });
    router.push(nextStep("who", creating));
  }
  return (
    <StepShell step="who" cta={<Cta onClick={next}>{creating ? "Create my club →" : "Continue"}</Cta>}>
      <Title>Who are you investing with?</Title>
      <Subtitle>Your club is private — only people you invite.</Subtitle>
      <div role="radiogroup" className="flex flex-col gap-[10px] mt-5">
        {OPTIONS.map((o) => <OptionCard key={o.id} title={o.title} sub={o.sub} selected={value === o.id} onSelect={() => setValue(o.id)} />)}
      </div>
      <div className="mt-4 bg-card border border-line rounded-[14px] px-[15px] py-3 flex items-center gap-[10px]">
        <span className="w-[26px] h-2 rounded-[4px] bg-white border border-[#E6DFCF]" aria-hidden />
        <p className="text-[12px] font-bold text-ink-2 leading-[1.45]">You&apos;ll start at <b className="text-ink">White Belt</b>. Lessons, research, picks and club activity earn XP — belts never measure account size.</p>
      </div>
    </StepShell>
  );
}
