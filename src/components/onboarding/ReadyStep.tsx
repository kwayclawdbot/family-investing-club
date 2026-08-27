"use client";
import { useState } from "react";
import { StepShell, Cta } from "./StepShell";
import { useAnswers } from "./store";

type PathRow = { slug: string; title: string; lessons: number };
const INVITE_CODE = "MENSAH-23";

export function ReadyStep({ paths }: { paths: PathRow[] }) {
  const { answers, ready } = useAnswers();
  const [copied, setCopied] = useState(false);

  const showInvite = !ready || !answers.who || answers.who === "family";
  const minutes = answers.daily ?? 10;
  const summary = [
    answers.start === "invest" ? "analysis-ready" : "beginner-friendly",
    answers.who === "class" ? "class-powered" : answers.who === "me" ? "self-paced" : "family-powered",
    `${minutes} minutes a day`,
  ];

  async function share() {
    const text = `Join our family on Family Investing Club — code ${INVITE_CODE}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Family Investing Club", text });
        return;
      }
      await navigator.clipboard.writeText(INVITE_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* user cancelled */
    }
  }

  return (
    <StepShell step="ready" cta={<Cta tone="orange" href="/lesson/if-7">Start Lesson 1 →</Cta>}>
      <div className="flex flex-col items-center text-center mt-[18px]">
        <span className="text-[44px] leading-none" aria-hidden>🎉</span>
        <h1 className="mt-[10px] text-[24px] font-black text-ink">Your path is ready, Kway!</h1>
        <p className="mt-[6px] text-[13.5px] font-semibold text-ink-3 leading-[1.5]">
          Built from your goals: {summary[0]},<br />
          {summary[1]}, {summary[2]}.
        </p>
      </div>

      <ol className="mt-5 bg-card border border-line rounded-[16px] px-4 py-2">
        {paths.map((p, i) => (
          <li key={p.slug} className={`flex items-center gap-3 py-[11px] ${i < paths.length - 1 ? "border-b border-paper-2" : ""}`}>
            <span
              className={`w-[34px] h-[34px] rounded-full flex items-center justify-center font-black text-[14px] shrink-0 ${
                i === 0 ? "bg-green-2 text-white" : "bg-line-3 text-ink-3"
              }`}
            >
              {i + 1}
            </span>
            <div className="flex-1">
              <div className="text-[14px] font-extrabold text-ink">{p.title}</div>
              <div className="text-[11.5px] font-bold text-ink-3">
                {p.lessons} lessons{i === 0 ? " · start here" : ""}
              </div>
            </div>
            {i === 0 && (
              <span className="bg-green-tint text-green rounded-[9px] px-[10px] py-1 text-[10.5px] font-black">FIRST</span>
            )}
          </li>
        ))}
      </ol>

      {showInvite && (
        <div className="mt-[14px] bg-orange-tint border border-orange-line rounded-[16px] px-4 py-[13px] flex items-center gap-3">
          <span className="text-[22px]" aria-hidden>✉️</span>
          <div className="flex-1">
            <div className="text-[13.5px] font-black text-ink">Invite your family</div>
            <div className="text-[12px] font-bold text-orange-2">
              Code: <b>{INVITE_CODE}</b>
            </div>
          </div>
          <button
            type="button"
            onClick={share}
            className="bg-orange text-cream-text rounded-[11px] px-[14px] py-2 text-[12px] font-black active:scale-95 transition"
          >
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      )}
    </StepShell>
  );
}
