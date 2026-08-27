"use client";
import Link from "next/link";
import { useState } from "react";
import type { ClubPost, Idea } from "@/lib/types";
import { Avatar, cx } from "@/components/ui";
import { PlusIcon } from "@/components/ui/icons";

const TABS = ["For You", "Following", "Trending"] as const;
type Tab = (typeof TABS)[number];

export function ClubFeed({ feed }: { feed: ClubPost[] }) {
  const [tab, setTab] = useState<Tab>("For You");
  return (
    <>
      {/* tab strip — orange underline on the active tab, purple ＋ (artboard 16) */}
      <div className="flex items-center gap-[18px] pt-[14px]" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cx(
              "pb-[6px] text-[15px] border-b-[3px] transition",
              tab === t ? "font-black text-ink border-orange" : "font-extrabold text-ink-4 border-transparent"
            )}
          >
            {t}
          </button>
        ))}
        <button
          aria-label="Post an idea"
          className="ml-auto w-[34px] h-[34px] rounded-full bg-purple text-white flex items-center justify-center active:scale-95 transition"
        >
          <PlusIcon size={18} />
        </button>
      </div>

      {tab === "For You" && (
        <div className="pb-6">
          {feed.map((post, i) =>
            post.kind === "idea" ? (
              <IdeaCard key={i} idea={post.idea} />
            ) : post.kind === "portfolio" ? (
              <PortfolioCard key={i} {...post} />
            ) : (
              <PollCard key={i} {...post} />
            )
          )}
        </div>
      )}
      {tab === "Following" && (
        <EmptyState emoji="👋" title="Nothing here yet" body="Follow people and ideas to fill this up." />
      )}
      {tab === "Trending" && (
        <EmptyState emoji="📈" title="Nothing trending yet" body="Ideas with the most research activity this week will show up here." />
      )}
    </>
  );
}

function EmptyState({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="mt-12 flex flex-col items-center text-center px-6">
      <span className="text-[34px]">{emoji}</span>
      <div className="mt-3 text-[15px] font-black text-ink">{title}</div>
      <div className="mt-1 text-[13px] font-semibold text-ink-3 leading-[1.45]">{body}</div>
    </div>
  );
}

const cardCls = "mt-3 bg-card border border-line rounded-[18px] px-4 py-[15px] block";

function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <Link href={`/club/idea/${idea.id}`} className={cardCls}>
      <div className="flex items-center gap-[10px]">
        <Avatar name={idea.author} color="bg-coral" size={34} />
        <div className="flex-1">
          <div className="text-[13.5px] font-black text-ink">{idea.author}</div>
          <div className="text-[11px] font-bold text-ink-4">{idea.ago}</div>
        </div>
        <span className="bg-orange-tint text-orange-2 rounded-[10px] px-[10px] py-1 text-[10.5px] font-black">INVESTMENT IDEA</span>
      </div>
      <div className="mt-[10px] text-[16.5px] font-black text-ink">{idea.title}</div>
      <div className="mt-[5px] text-[13px] font-semibold text-ink-2 leading-[1.45]">{idea.summary}</div>
      <div className="mt-[9px] text-[11.5px] font-extrabold text-ink-3">Companies we&apos;re researching:</div>
      <div className="flex gap-[7px] mt-[6px] flex-wrap">
        {idea.companies.map((c) => (
          <span key={c.symbol} className="bg-green-tint text-green rounded-[9px] px-[11px] py-1 text-[11.5px] font-black">
            {c.symbol}
          </span>
        ))}
      </div>
      <div className="flex gap-[18px] mt-3 text-[12px] font-extrabold text-ink-3">
        <span>❤️ {idea.likes}</span>
        <span>💬 {idea.comments}</span>
        <span>🔖 {idea.saves} saved</span>
      </div>
    </Link>
  );
}

function PortfolioCard({ name, ytdPct, holdings, followers }: { name: string; ytdPct: number; holdings: number; followers: number }) {
  return (
    <div className={cardCls}>
      <div className="flex items-center gap-[10px]">
        <span className="w-[34px] h-[34px] rounded-[11px] bg-green text-white flex items-center justify-center text-[12px] font-black">M</span>
        <div className="flex-1">
          <div className="text-[13.5px] font-black text-ink">{name}</div>
          <div className="text-[11px] font-bold text-ink-4">Model Portfolio</div>
        </div>
        <button aria-label="More" className="text-ink-4 font-black text-[16px] px-1">⋮</button>
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
        <div className="text-[12px] font-extrabold text-ink-3">
          {holdings} Holdings · {followers} followers
        </div>
        <Link href="/practice" className="bg-green-2 text-cream-text rounded-[11px] px-[14px] py-[7px] text-[12px] font-black">
          View Portfolio
        </Link>
      </div>
    </div>
  );
}

function PollCard({ author, ago, question, options }: { author: string; ago: string; question: string; options: { label: string; pct: number }[] }) {
  const [choice, setChoice] = useState<string | null>(null);
  return (
    <div className={cardCls}>
      <div className="flex items-center gap-[10px]">
        <Avatar name={author} color="bg-green-3" size={34} />
        <div className="flex-1">
          <div className="text-[13.5px] font-black text-ink">{author}</div>
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
