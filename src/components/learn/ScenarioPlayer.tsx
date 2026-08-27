"use client";
import Link from "next/link";
import { useState } from "react";
import type { Scenario } from "@/lib/types";
import { Button, ButtonLink, Card, cx } from "@/components/ui";
import { KaiSpark } from "@/components/ui/icons";

/** Branching scenario: situation → choice → outcome → continue, ending on the lesson step. */
export function ScenarioPlayer({ scenario }: { scenario: Scenario }) {
  const [stepId, setStepId] = useState(scenario.steps[0].id);
  const [pending, setPending] = useState<{ label: string; next: string | null; outcome?: string; good?: boolean } | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const step = scenario.steps.find((s) => s.id === stepId)!;
  const isEnd = step.choices.length === 0;
  const stepNo = path.length + 1;

  function choose(c: (typeof step.choices)[number]) {
    if (step.choices.length > 1) setPath((p) => [...p, c.label]); // single-choice steps are reveals, not decisions
    if (c.outcome) setPending(c);
    else if (c.next) setStepId(c.next);
  }
  function cont() { if (pending?.next) setStepId(pending.next); setPending(null); }
  function restart() { setStepId(scenario.steps[0].id); setPending(null); setPath([]); }

  return (
    <div className="pb-6">
      <div className="text-[11px] font-extrabold text-orange uppercase tracking-[0.3px] mt-1">{isEnd ? "Lesson" : `Situation ${stepNo}`} · {scenario.title}</div>
      <Card className={cx("mt-3 rounded-card-lg", isEnd && "bg-green-tint border-green-line")}>
        <p className="text-[16px] font-bold text-ink leading-[1.55]">{step.text}</p>
      </Card>

      {pending ? (
        <Card tone={pending.good ? "green" : "orange"} className="mt-3">
          <div className={cx("text-[13px] font-black", pending.good ? "text-green" : "text-orange-3")}>{pending.good ? "✓ Sound decision" : "Costly decision"}</div>
          <p className="mt-1 text-[13.5px] font-bold text-ink leading-[1.5]">{pending.outcome}</p>
          <Button onClick={cont} variant={pending.good ? "green" : "primary"} size="md" className="mt-3">Continue</Button>
        </Card>
      ) : isEnd ? (
        <>
          <Card className="mt-3">
            <div className="text-[11px] font-extrabold text-ink-3 uppercase tracking-[0.3px]">Your choices</div>
            <ol className="mt-2 flex flex-col gap-1 text-[13px] font-bold text-ink">
              {path.map((p, i) => <li key={i}>{i + 1}. {p}</li>)}
            </ol>
          </Card>
          <div className="mt-4 inline-flex items-center rounded-[20px] bg-purple-tint px-4 py-2 text-[14px] font-black text-purple-2">⭐ +15 XP</div>
          <div className="flex flex-col gap-2 mt-5">
            <Link href={`/kai?context=scenario:${scenario.id}`} className="h-[52px] rounded-[16px] bg-purple-2 text-cream-text font-black text-[16px] inline-flex items-center justify-center gap-2"><KaiSpark size={16} /> Ask Kai about this</Link>
            <Button onClick={restart} variant="secondary" full>Try different choices</Button>
            <ButtonLink href="/learn/scenarios" variant="ghost" full>Back to scenarios</ButtonLink>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2 mt-4">
          <div className="text-[12px] font-extrabold text-ink-3">What do you do?</div>
          {step.choices.map((c) => (
            <button key={c.label} type="button" onClick={() => choose(c)} className="rounded-[14px] border border-line bg-card px-4 py-[14px] text-left text-[14px] font-extrabold text-ink active:bg-green-tint active:border-green-2 transition">{c.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
