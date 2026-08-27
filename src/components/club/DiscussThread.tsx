"use client";
import Link from "next/link";
import { useState } from "react";
import type { Comment } from "@/lib/types";
import { Avatar, Tag, cx } from "@/components/ui";
import { ConceptChip } from "@/components/ui/extras";
import { KaiSpark, SendIcon } from "@/components/ui/icons";
import { useStored } from "./storage";

const DEFS: Record<string, { d: string; href: string }> = {
  "Time horizon": { d: "How long you plan to hold before you need the money. Longer horizons can ride out more volatility.", href: "/learn/path/investing-foundations" },
  Risk: { d: "The chance an investment loses value — and how much. Good theses name their risks as clearly as their upside.", href: "/learn/path/investing-foundations" },
  Valuation: { d: "What you pay versus what you get. A great company can still be a poor investment at the wrong price.", href: "/learn/path/company-analysis" },
  Sectors: { d: "Groups of companies in the same business area — energy, tech, healthcare — that tend to move together.", href: "/learn/path/stock-market-101" },
};

function roleTone(role?: string): "green" | "orange" | "muted" {
  if (!role) return "muted";
  if (/educator|coach/i.test(role)) return "green";
  if (/owner/i.test(role)) return "orange";
  return "muted";
}

function CommentRow({ c, depth = 0 }: { c: Comment; depth?: number }) {
  return (
    <li className={cx(depth > 0 && "ml-[38px] mt-2")}>
      <div className="flex items-start gap-[10px]">
        <Avatar name={c.author} size={depth > 0 ? 26 : 32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-black text-ink">{c.author}</span>
            {c.role && <Tag tone={roleTone(c.role)}>{c.role}</Tag>}
            <span className="text-[11px] font-bold text-ink-4">{c.ago}</span>
          </div>
          <p className="mt-1 text-[13px] font-semibold text-ink-2 leading-[1.5]">{c.text}</p>
          {c.concept && (
            <div className="mt-[6px]">
              <ConceptChip label={c.concept} definition={DEFS[c.concept]?.d ?? `${c.concept} — tap Learn to see the lesson.`} lessonHref={DEFS[c.concept]?.href ?? "/learn/library"} tone="purple" />
            </div>
          )}
        </div>
      </div>
      {c.replies && c.replies.length > 0 && (
        <ul>{c.replies.map((r) => <CommentRow key={r.id} c={r} depth={depth + 1} />)}</ul>
      )}
    </li>
  );
}

export function DiscussThread({ ideaId, title, comments }: { ideaId: string; title: string; comments: Comment[] }) {
  const [mine, setMine] = useStored<Comment[]>(`fic.comments.${ideaId}`, []);
  const [text, setText] = useState("");
  const all = [...comments, ...mine];

  function post() {
    const t = text.trim();
    if (!t) return;
    setMine((p) => [...p, { id: `me-${Date.now()}`, author: "Kway M.", role: "Member", ago: "Just now", text: t }]);
    setText("");
  }

  return (
    <div className="-mx-[18px] flex flex-col min-h-full">
      <div className="flex-1 px-[18px] pb-4">
        <div className="mt-1 bg-purple-tint border border-purple-line rounded-[12px] px-3 py-[9px] flex items-center gap-2">
          <span className="text-[11px] font-extrabold text-purple-2 uppercase tracking-[0.3px] shrink-0">Discussing</span>
          <Link href={`/club/idea/${ideaId}`} className="text-[12.5px] font-black text-ink truncate">{title}</Link>
        </div>

        <Link href={`/kai?context=${encodeURIComponent(`idea:${ideaId}`)}`} className="mt-3 flex items-center gap-2 bg-card border border-line rounded-[12px] px-3 py-[10px]">
          <span className="w-7 h-7 rounded-full bg-purple-2 text-cream-text flex items-center justify-center"><KaiSpark size={13} /></span>
          <span className="flex-1 text-[12.5px] font-extrabold text-ink">Summarize the debate with Kai</span>
          <span className="text-[11px] font-bold text-ink-4">for &amp; against</span>
        </Link>

        <div className="mt-4 text-[12px] font-extrabold text-ink-3">{all.length} comments</div>
        <ul className="mt-2 flex flex-col gap-4">
          {all.map((c) => <CommentRow key={c.id} c={c} />)}
        </ul>
        <p className="mt-5 text-[10.5px] font-semibold text-ink-4 leading-[1.4]">Be kind, cite sources, and remember: discussion is for learning — not personalized advice.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); post(); }} className="sticky bottom-0 z-10 flex items-center gap-2 bg-nav border-t border-line-2 px-[18px] pt-3 pb-[14px] shrink-0">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add to the discussion…" aria-label="Reply"
          className="flex-1 h-[42px] rounded-[14px] border border-line bg-card px-4 text-[13.5px] font-bold text-ink placeholder:text-ink-4 outline-none focus:border-purple" />
        <button type="submit" aria-label="Post reply" disabled={!text.trim()} className="w-[42px] h-[42px] rounded-full bg-purple-2 text-cream-text flex items-center justify-center disabled:opacity-40">
          <SendIcon />
        </button>
      </form>
    </div>
  );
}
