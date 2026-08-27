"use client";
import Link from "next/link";
import { useState } from "react";
import type { ClubPost } from "@/lib/types";
import { cx } from "@/components/ui";
import { EmptyState } from "@/components/ui/extras";
import { PlusIcon } from "@/components/ui/icons";
import { IdeaCard, PortfolioCard, PollCard, QuestionCard, sampleQuestion } from "./cards";

const TABS = ["For You", "Following", "Trending"] as const;
type Tab = (typeof TABS)[number];

const FILTERS = [
  { label: "Ideas", href: "/club" },
  { label: "Groups", href: "/club/groups" },
  { label: "Portfolios", href: "/club/portfolio/fic-growth" },
  { label: "Challenges", href: "/club/challenges" },
  { label: "Live", href: "/live" },
];

const memberHref: Record<string, string> = { "Sarah J.": "/club/members/sarah-j", "Michael T.": "/club/members/michael-t" };

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
        <Link
          href="/club/new"
          aria-label="Post an idea"
          className="ml-auto w-[34px] h-[34px] rounded-full bg-purple text-white flex items-center justify-center active:scale-95 transition"
        >
          <PlusIcon size={18} />
        </Link>
      </div>

      {/* object filters — Club is organised around structured objects, not a raw feed */}
      <div className="flex gap-[6px] mt-3 overflow-x-auto no-scrollbar -mx-[18px] px-[18px]">
        {FILTERS.map((f, i) => (
          <Link
            key={f.label}
            href={f.href}
            className={cx(
              "shrink-0 h-[30px] px-[13px] rounded-[10px] text-[12px] font-extrabold inline-flex items-center",
              i === 0 ? "bg-purple-2 text-cream-text" : "bg-card border border-line text-ink-3"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {tab === "For You" && (
        <div className="pb-6">
          {feed.map((post, i) =>
            post.kind === "idea" ? (
              <IdeaCard key={i} idea={post.idea} authorHref={memberHref[post.idea.author]} />
            ) : post.kind === "portfolio" ? (
              <PortfolioCard key={i} {...post} />
            ) : (
              <PollCard key={i} {...post} authorHref={memberHref[post.author]} />
            )
          )}
          <QuestionCard q={sampleQuestion} />
        </div>
      )}
      {tab === "Following" && (
        <div className="mt-4">
          <EmptyState emoji="👋" title="Nothing here yet" body="Follow people and ideas to fill this up." action="Find people" href="/club/groups" />
        </div>
      )}
      {tab === "Trending" && (
        <div className="mt-4">
          <EmptyState emoji="📈" title="Nothing trending yet" body="Ideas with the most research activity this week will show up here." />
        </div>
      )}
    </>
  );
}
