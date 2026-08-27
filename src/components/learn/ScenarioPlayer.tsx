"use client";
import Link from "next/link";
import { useState } from "react";
import type { Scenario } from "@/lib/types";
import { Button, ButtonLink, Card, cx } from "@/components/ui";
import { ChevronLeft, KaiSpark } from "@/components/ui/icons";

type Choice = Scenario["steps"][number]["choices"][number];

/** Presentation config per scenario (artboard 19): the portfolio strip + Simbot's opening question. */
const COACH: Record<string, { impact: string; ask: string }> = {
  "first-drawdown": { impact: "−15% this month", ask: "Before you act — what changed today: the company's <i>business</i>, or just its <i>price</i>?" },
  "hot-tip": { impact: "$2,000 free to invest", ask: "Before you act — can you say, in one sentence, how ZAPP makes money?" },
};
const DEFAULT_COACH = { impact: "practice money", ask: "What do you see? Ask: did the <i>business</i> change, or only the mood?" };

function Simbot({ html, tone = "green" }: { html: string; tone?: "green" | "orange" }) {
  return (
    <div className="mt-3 flex gap-[9px]">
      <span className="w-[30px] h-[30px] rounded-[11px] bg-green-2 flex items-center justify-center text-[13px] shrink-0" aria-hidden>🤖</span>
      <div className={cx("rounded-[4px_16px_16px_16px] border px-[14px] py-[11px] text-[13.5px] font-semibold text-ink leading-[1.45]", tone === "green" ? "bg-green-tint border-green-line" : "bg-orange-tint border-orange-line")}>
        <b>Simbot:</b> <span dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

/** Branching scenario with the Simbot coach (spec §3.12): situation → coach question → choice → outcome → lesson. */
export function ScenarioPlayer({ scenario }: { scenario: Scenario }) {
  const [stepId, setStepId] = useState(scenario.steps[0].id);
  const [pending, setPending] = useState<Choice | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const step = scenario.steps.find((s) => s.id === stepId)!;
  const isEnd = step.choices.length === 0;
  const stepIdx = scenario.steps.findIndex((s) => s.id === stepId);
  const total = scenario.steps.length;
  const coach = COACH[scenario.id] ?? DEFAULT_COACH;
  const isDecision = step.choices.length > 1;

  function choose(c: Choice) {
    if (isDecision) setPath((p) => [...p, c.label]);
    if (c.outcome) setPending(c);
    else if (c.next) setStepId(c.next);
  }
  function cont() { if (pending?.next) setStepId(pending.next); setPending(null); }
  function restart() { setStepId(scenario.steps[0].id); setPending(null); setPath([]); }

  return (
    <div className="flex flex-col min-h-full pt-[14px] pb-[24px]">
      <div className="flex items-center gap-[14px]">
        <Link href="/learn/scenarios" aria-label="Back" className="text-ink-3"><ChevronLeft size={22} /></Link>
        <span className="rounded-[9px] bg-purple-tint px-[11px] py-1 text-[10.5px] font-black text-purple-2 uppercase">{isEnd ? "Scenario · Lesson" : `Scenario · Step ${stepIdx + 1} of ${total}`}</span>
      </div>
      <h1 className="mt-[14px] text-[21px] font-black text-ink">{scenario.title}</h1>

      <Card className={cx("mt-[10px] px-4 py-[14px]", isEnd && "bg-green-tint border-green-line")}>
        {!isEnd && (
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-black text-red">YOUR PRACTICE PORTFOLIO</span>
            <span className="text-[16px] font-black text-red">{coach.impact}</span>
          </div>
        )}
        <p className={cx("text-[13.5px] font-semibold text-[#4A4436] leading-[1.5]", !isEnd && "mt-2")}>{step.text}</p>
      </Card>

      {pending ? (
        <>
          <Simbot html={`${pending.good ? "Sound decision." : "That one cost you."} ${pending.outcome ?? ""}`} tone={pending.good ? "green" : "orange"} />
          <div className="mt-4"><Button onClick={cont} variant={pending.good ? "green" : "primary"} full>Continue</Button></div>
        </>
      ) : isEnd ? (
        <>
          <Simbot html="That's the lesson. Notice how the <i>question</i> — did the business change? — did more work than any prediction." />
          {path.length > 0 && (
            <Card className="mt-3">
              <div className="text-[11px] font-extrabold text-ink-3 uppercase tracking-[0.3px]">Your choices</div>
              <ol className="mt-2 flex flex-col gap-1 text-[13px] font-bold text-ink">{path.map((p, i) => <li key={i}>{i + 1}. {p}</li>)}</ol>
            </Card>
          )}
          <div className="mt-4 self-start inline-flex items-center rounded-[20px] bg-purple-tint px-4 py-2 text-[14px] font-black text-purple-2">⭐ +15 XP</div>
          <div className="flex flex-col gap-2 mt-5">
            <Link href={`/kai?context=scenario:${scenario.id}`} className="h-[52px] rounded-[16px] bg-purple-2 text-cream-text font-black text-[16px] inline-flex items-center justify-center gap-2"><KaiSpark size={16} /> Ask Kai about this</Link>
            <Button onClick={restart} variant="secondary" full>Try different choices</Button>
            <ButtonLink href="/learn/scenarios" variant="ghost" full>Back to scenarios</ButtonLink>
          </div>
        </>
      ) : (
        <>
          <Simbot html={isDecision ? coach.ask : "Here's how that played out. Ready to see why?"} />
          <div className="mt-[14px] text-[13px] font-black text-ink-3">{isDecision ? "WHAT DO YOU DO?" : "NEXT"}</div>
          <div className="flex flex-col gap-[9px] mt-[9px]">
            {step.choices.map((c) => {
              const [title, sub] = c.label.split(" — ");
              return (
                <button key={c.label} type="button" onClick={() => choose(c)} className="rounded-[14px] border-[1.5px] border-line bg-card px-4 py-[13px] text-left active:bg-green-tint active:border-green-2 transition">
                  <div className="text-[14.5px] font-extrabold text-ink">{title}</div>
                  {sub && <div className="text-[11.5px] font-bold text-ink-3">{sub}</div>}
                </button>
              );
            })}
          </div>
          <p className="mt-auto pt-6 text-center text-[11.5px] font-bold text-ink-4">Simulated money · your choice plays out in the next step</p>
        </>
      )}
    </div>
  );
}
