"use client";
import { useState } from "react";
import Link from "next/link";
import { StepShell, Cta } from "./StepShell";
import { useAnswers } from "./store";

type PathRow = { slug: string; title: string; lessons: number };
const INVITE_CODE = "MENSAH-23";
const INVITE_LINK = `fic.club/join/${INVITE_CODE}`;

/** Onboarding v2 · final (artboard 15): club ready, invite first; skill plan below. Explorers get the path version. */
export function ReadyStep({ paths }: { paths: PathRow[] }) {
  const { answers, ready } = useAnswers();
  const [copied, setCopied] = useState(false);
  const exploring = ready && (answers.who === "explore" || answers.who === "join");
  const clubName = answers.clubName?.replace(/ Family Investing Club$/i, " Club").replace(/ Investing Club$/i, " Club") || "The Mensah Club";
  const initial = clubName.replace(/^The /, "").slice(0, 1).toUpperCase();
  const minutes = answers.daily ?? 10;
  const plan = `${paths[0]?.title ?? "Money Basics"} → ${paths[1]?.title ?? "Investing Foundations"}`;

  async function share() {
    const text = `Join ${clubName} on Family Investing Club — ${INVITE_LINK}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: clubName, text });
        return;
      }
      await navigator.clipboard.writeText(`https://${INVITE_LINK}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* user cancelled */
    }
  }

  if (exploring) {
    return (
      <StepShell step="ready" creating={false} cta={<Cta tone="orange" href="/lesson/if-7">Start Lesson 1 →</Cta>}>
        <div className="flex flex-col items-center text-center mt-[14px]">
          <span className="text-[40px] leading-none" aria-hidden>🎉</span>
          <h1 className="mt-2 text-[24px] font-black text-ink">Your path is ready, Kway!</h1>
          <p className="mt-[5px] text-[13.5px] font-semibold text-ink-3">{answers.who === "join" ? `We'll add you to the club for code ${answers.joinCode || "—"} once the founder approves.` : "Explore ideas, lessons and practice — create a club whenever you're ready."}</p>
        </div>
        <ol className="mt-5 bg-card border border-line rounded-[16px] px-4 py-2">
          {paths.map((p, i) => (
            <li key={p.slug} className={`flex items-center gap-3 py-[11px] ${i < paths.length - 1 ? "border-b border-paper-2" : ""}`}>
              <span className={`w-[34px] h-[34px] rounded-full flex items-center justify-center font-black text-[14px] shrink-0 ${i === 0 ? "bg-green-2 text-white" : "bg-line-3 text-ink-3"}`}>{i + 1}</span>
              <div className="flex-1">
                <div className="text-[14px] font-extrabold text-ink">{p.title}</div>
                <div className="text-[11.5px] font-bold text-ink-3">{p.lessons} lessons{i === 0 ? " · start here" : ""}</div>
              </div>
              {i === 0 && <span className="bg-green-tint text-green rounded-[9px] px-[10px] py-1 text-[10.5px] font-black">FIRST</span>}
            </li>
          ))}
        </ol>
        <Link href="/onboarding/create" className="mt-[14px] block bg-card border border-line rounded-[14px] px-4 py-3 text-center text-[13px] font-extrabold text-green">
          Create a club later →
        </Link>
      </StepShell>
    );
  }

  return (
    <StepShell step="ready" cta={<Cta href="/club?state=new">Go to My Club</Cta>}>
      <div className="flex flex-col items-center text-center mt-[14px]">
        <span className="text-[40px] leading-none" aria-hidden>🎉</span>
        <h1 className="mt-2 text-[24px] font-black text-ink">Your club is ready!</h1>
        <p className="mt-[5px] text-[13.5px] font-semibold text-ink-3">Now the important part — get your people in.</p>
      </div>

      <div className="mt-4 bg-card border border-line rounded-[18px] p-4 text-center">
        <div className="w-14 h-14 rounded-[18px] bg-green-2 text-cream-text font-black text-[20px] flex items-center justify-center mx-auto">{initial}</div>
        <div className="mt-[9px] text-[18px] font-black text-ink">{clubName}</div>
        <div className="text-[11.5px] font-extrabold text-ink-3">🔒 Private · 1 member (you) · founder</div>
        <div className="flex justify-center mt-3">
          <span className="w-[38px] h-[38px] rounded-full bg-green-2 text-white font-black text-[15px] flex items-center justify-center border-2 border-[#FFFDF7]">K</span>
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-[38px] h-[38px] rounded-full bg-paper border-2 border-dashed border-[#D9CDB2] text-ink-4 font-black flex items-center justify-center -ml-2">+</span>
          ))}
        </div>
        <button
          type="button"
          onClick={share}
          className="mt-3 w-full bg-paper border border-dashed border-[#D9CDB2] rounded-[12px] py-[10px] font-mono text-[14px] font-bold text-ink"
        >
          fic.club/join/<b className="text-orange">{INVITE_CODE}</b>
        </button>
        <button
          type="button"
          onClick={share}
          className="mt-[11px] w-full bg-orange text-cream-text rounded-[14px] py-[13px] text-[14.5px] font-black shadow-[0_3px_0_#C96D25] active:translate-y-[2px] active:shadow-none transition"
        >
          {copied ? "Link copied" : "Share Invite Link"}
        </button>
      </div>

      <Link href="/learn" className="mt-[14px] block bg-card border border-line rounded-[16px] px-4 py-[13px]">
        <div className="text-[11px] font-black text-ink-3">YOUR PERSONAL SKILL PLAN · BUILT FROM YOUR GOALS</div>
        <div className="flex items-center gap-[11px] mt-[9px]">
          <span className="w-8 h-8 rounded-full bg-green-2 text-white font-black text-[13px] flex items-center justify-center">1</span>
          <span className="flex-1">
            <span className="block text-[13.5px] font-extrabold text-ink">{plan}</span>
            <span className="block text-[11px] font-bold text-ink-3">{answers.daily === null ? "no daily goal" : `${minutes} min/day`} · learn as you invest, not before</span>
          </span>
          <span className="text-ink-4 font-black">›</span>
        </div>
      </Link>
    </StepShell>
  );
}
