"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepShell, Title, Subtitle, Cta, OptionCard } from "./StepShell";
import { readAnswers, writeAnswers, nextStep, type OnboardingAnswers } from "./store";

type Who = NonNullable<OnboardingAnswers["who"]>;
const OPTIONS: { id: Who; title: string; sub: string }[] = [
  { id: "create", title: "Create my club", sub: "Invite family & friends — research and pick together" },
  { id: "join", title: "Join a club", sub: "Have an invite code or link?" },
  { id: "explore", title: "Explore FIC first", sub: "Browse ideas, lessons & practice solo — create a club later" },
];

/** Onboarding v2 · step 1 (artboard 14): "Who are you investing with?" */
export function WhoStep() {
  const router = useRouter();
  const [value, setValue] = useState<Who>("create");
  const [code, setCode] = useState("");
  useEffect(() => {
    const a = readAnswers();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    if (a.who) setValue(a.who);
     
    if (a.joinCode) setCode(a.joinCode);
  }, []);

  function next() {
    writeAnswers({ who: value, joinCode: value === "join" ? code.trim().toUpperCase() : undefined });
    router.push(nextStep("who", value === "create"));
  }

  return (
    <StepShell step="who" cta={<Cta onClick={next}>Continue</Cta>}>
      <Title>Who are you investing with?</Title>
      <Subtitle>FIC is built around private investing clubs — family, friends, any circle you trust.</Subtitle>
      <div role="radiogroup" className="flex flex-col gap-[10px] mt-5">
        {OPTIONS.map((o) => (
          <div key={o.id}>
            <OptionCard title={o.title} sub={o.sub} selected={value === o.id} onSelect={() => setValue(o.id)} />
            {o.id === "join" && value === "join" && (
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Invite code or link · e.g. MENSAH-23"
                autoFocus
                className="mt-2 w-full h-[46px] rounded-[12px] border border-line bg-card px-4 font-mono text-[14px] font-bold text-ink placeholder:text-ink-4 placeholder:font-sans outline-none focus:border-green-2"
                aria-label="Invite code"
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 bg-card border border-line rounded-[14px] px-[15px] py-3 flex items-center gap-[10px]">
        <span className="text-[18px]" aria-hidden>🔒</span>
        <p className="text-[12.5px] font-bold text-ink-2 leading-[1.45]">
          Clubs are <b className="text-green">private</b> — only people you invite can see picks, votes and discussions.
        </p>
      </div>
    </StepShell>
  );
}
