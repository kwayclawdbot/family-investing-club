"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Idea } from "@/lib/types";
import { Avatar, cx } from "@/components/ui";

export const cardCls = "mt-3 bg-card border border-line rounded-[18px] px-4 py-[15px] block";

export function IdeaCard({ idea, href, authorHref }: { idea: Idea; href?: string | null; authorHref?: string }) {
  const router = useRouter();
  // author is a button (not a nested <a>) so the whole card can stay a link
  const goAuthor = (e: React.MouseEvent) => {
    if (!authorHref) return;
    e.preventDefault();
    e.stopPropagation();
    router.push(authorHref);
  };
  const body = (
    <>
      <div className="flex items-center gap-[10px]">
        <button type="button" onClick={goAuthor} disabled={!authorHref} className="contents text-left" aria-label={authorHref ? `View ${idea.author}` : undefined}>
          <Avatar name={idea.author} color="bg-coral" size={34} />
        </button>
        <div className="flex-1">
          <button type="button" onClick={goAuthor} disabled={!authorHref} className={cx("text-[13.5px] font-black text-ink text-left", authorHref && "hover:underline")}>{idea.author}</button>
          <div className="text-[11px] font-bold text-ink-4">{idea.ago}</div>
        </div>
        <span className="bg-orange-tint text-orange-2 rounded-[10px] px-[10px] py-1 text-[10.5px] font-black">INVESTMENT IDEA</span>
      </div>
      <div className="mt-[10px] text-[16.5px] font-black text-ink">{idea.title || "Untitled idea"}</div>
      <div className="mt-[5px] text-[13px] font-semibold text-ink-2 leading-[1.45]">{idea.summary || "Your thesis summary will show here."}</div>
      {idea.companies.length > 0 && (
        <>
          <div className="mt-[9px] text-[11.5px] font-extrabold text-ink-3">Companies we&apos;re researching:</div>
          <div className="flex gap-[7px] mt-[6px] flex-wrap">
            {idea.companies.map((c) => (
              <span key={c.symbol} className="bg-green-tint text-green rounded-[9px] px-[11px] py-1 text-[11.5px] font-black">{c.symbol}</span>
            ))}
          </div>
        </>
      )}
      <div className="flex gap-[18px] mt-3 text-[12px] font-extrabold text-ink-3">
        <span>❤️ {idea.likes}</span>
        <span>💬 {idea.comments}</span>
        <span>🔖 {idea.saves} saved</span>
      </div>
    </>
  );
  if (href === null) return <div className={cardCls}>{body}</div>;
  return (
    <Link href={href ?? `/club/idea/${idea.id}`} className={cardCls}>
      {body}
    </Link>
  );
}

export function PortfolioCard({ id = "fic-growth", name, ytdPct, holdings, followers }: { id?: string; name: string; ytdPct: number; holdings: number; followers: number }) {
  return (
    <div className={cardCls}>
      <div className="flex items-center gap-[10px]">
        <span className="w-[34px] h-[34px] rounded-[11px] bg-green text-white flex items-center justify-center text-[12px] font-black">M</span>
        <div className="flex-1">
          <div className="text-[13.5px] font-black text-ink">{name}</div>
          <div className="text-[11px] font-bold text-ink-4">Model Portfolio · virtual money</div>
        </div>
        <Link href={`/club/portfolio/${id}`} aria-label="More" className="text-ink-4 font-black text-[16px] px-1">⋮</Link>
      </div>
      <div className="flex items-end justify-between mt-[10px]">
        <div>
          <div className="text-[22px] font-black text-[#3A8C4A] leading-none">+{ytdPct}%</div>
          <div className="mt-1 text-[11px] font-extrabold text-ink-3">YTD Return</div>
        </div>
        <svg width="150" height="46" viewBox="0 0 150 46" aria-hidden>
          <polyline fill="none" stroke="#4C8C4A" strokeWidth="2" points="0,38 15,34 30,38 45,28 60,32 75,22 90,26 105,16 120,20 135,10 150,14" />
        </svg>
      </div>
      <div className="flex items-center justify-between mt-[10px]">
        <div className="text-[12px] font-extrabold text-ink-3">{holdings} Holdings · {followers} followers</div>
        <Link href={`/club/portfolio/${id}`} className="bg-green-2 text-cream-text rounded-[11px] px-[14px] py-[7px] text-[12px] font-black">
          View Portfolio
        </Link>
      </div>
    </div>
  );
}

export function PollCard({ author, ago, question, options, authorHref }: { author: string; ago: string; question: string; options: { label: string; pct: number }[]; authorHref?: string }) {
  const [choice, setChoice] = useState<string | null>(null);
  return (
    <div className={cardCls}>
      <div className="flex items-center gap-[10px]">
        <Avatar name={author} color="bg-green-3" size={34} />
        <div className="flex-1">
          {authorHref ? (
            <Link href={authorHref} className="text-[13.5px] font-black text-ink hover:underline">{author}</Link>
          ) : (
            <div className="text-[13.5px] font-black text-ink">{author}</div>
          )}
          <div className="text-[11px] font-bold text-ink-4">{ago}</div>
        </div>
        <span className="bg-purple-tint text-purple-2 rounded-[10px] px-[10px] py-1 text-[10.5px] font-black">POLL</span>
      </div>
      <div className="mt-[10px] text-[14.5px] font-black text-ink">{question}</div>
      <div className="mt-[10px] flex flex-col gap-[7px]" role="radiogroup">
        {options.map((o) => {
          const chosen = choice === o.label;
          return (
            <button
              key={o.label}
              role="radio"
              aria-checked={chosen}
              onClick={() => setChoice(o.label)}
              className={cx("relative bg-paper-2 rounded-[10px] overflow-hidden text-left", chosen && "ring-2 ring-purple")}
            >
              <div className="absolute inset-y-0 left-0 bg-purple-line" style={{ width: `${o.pct}%` }} />
              <div className="relative flex justify-between px-3 py-2 text-[12.5px] font-extrabold text-ink">
                <span>{chosen ? "✓ " : ""}{o.label}</span>
                <span>{o.pct}%</span>
              </div>
            </button>
          );
        })}
      </div>
      {choice && <div className="mt-2 text-[11px] font-bold text-ink-4">Thanks — polls are a discussion prompt, not investment advice.</div>}
    </div>
  );
}

export type QuestionObj = { id: string; author: string; ago: string; question: string; answers: number; href: string; concept?: string };
export const sampleQuestion: QuestionObj = {
  id: "q-45",
  author: "Dana R.",
  ago: "4h ago",
  question: "Is it too late to start investing at 45?",
  answers: 3,
  href: "/club/groups/beginners-circle",
  concept: "Compounding",
};

export function QuestionCard({ q, href }: { q: QuestionObj; href?: string }) {
  return (
    <Link href={href ?? q.href} className={cardCls}>
      <div className="flex items-center gap-[10px]">
        <Avatar name={q.author} color="bg-purple" size={34} />
        <div className="flex-1">
          <div className="text-[13.5px] font-black text-ink">{q.author}</div>
          <div className="text-[11px] font-bold text-ink-4">{q.ago}</div>
        </div>
        <span className="bg-green-tint text-green rounded-[10px] px-[10px] py-1 text-[10.5px] font-black">QUESTION</span>
      </div>
      <div className="mt-[10px] text-[15px] font-black text-ink">
        <span className="text-ink-4">Q · </span>{q.question}
      </div>
      <div className="mt-[10px] flex items-center justify-between">
        <span className="text-[12px] font-extrabold text-green">🎓 {q.answers} educator answers</span>
        {q.concept && <span className="bg-purple-tint text-purple-2 rounded-[8px] px-2 py-[3px] text-[10px] font-extrabold uppercase">Concept: {q.concept}</span>}
      </div>
    </Link>
  );
}
