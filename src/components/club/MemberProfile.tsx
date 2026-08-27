"use client";
import Link from "next/link";
import { useState } from "react";
import type { Member, Idea } from "@/lib/types";
import { Avatar, Tag, cx } from "@/components/ui";
import { EmptyState, Sheet, StatTile } from "@/components/ui/extras";
import { IdeaCard } from "./cards";
import { useStored } from "./storage";

const REASONS = ["Personalized financial advice", "Spam or promotion", "Harassment or bullying", "Misleading claims", "Something else"];

export function MemberProfile({ m, ideas }: { m: Member; ideas: Idea[] }) {
  const [follows, setFollows] = useStored<Record<string, boolean>>("fic.follows", {});
  const [muted, setMuted] = useStored<Record<string, boolean>>("fic.muted", {});
  const [report, setReport] = useState(false);
  const [reported, setReported] = useState(false);
  const following = !!follows[m.id];
  const isMuted = !!muted[m.id];
  const youth = !!m.ageBadge;
  const tone = /educator/i.test(m.role) ? "green" : /owner/i.test(m.role) ? "orange" : youth ? "gold" : "muted";

  return (
    <div className="pb-6">
      <div className="flex items-center gap-4 mt-1">
        <Avatar name={m.name} size={64} color={youth ? "bg-gold" : undefined} />
        <div className="flex-1 min-w-0">
          <h1 className="text-[21px] font-black text-ink leading-tight">{m.name}</h1>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <Tag tone={tone}>{youth ? "Young learner" : m.role}</Tag>
            {m.ageBadge && <Tag tone="gold">{m.ageBadge}</Tag>}
            <span className="text-[11px] font-bold text-ink-4">{m.level} · joined {m.joined}</span>
          </div>
        </div>
      </div>

      {youth ? (
        <div className="mt-3 bg-paper-2 border border-line rounded-card px-4 py-3 text-[12.5px] font-bold text-ink-3 leading-[1.5]">
          Young learner · limited profile. Bio, favourites and contact are hidden to protect younger members.
        </div>
      ) : (
        <p className="mt-3 text-[13.5px] font-semibold text-ink-2 leading-[1.5]">{m.bio}</p>
      )}

      <div className="mt-3 flex gap-2">
        <StatTile value={m.ideas} label="ideas" tone="orange" />
        <StatTile value={m.comments} label="comments" />
        <StatTile value={m.badges.length} label="badges" tone="green" />
      </div>

      <div className="mt-3 flex gap-2">
        <button
          aria-pressed={following}
          onClick={() => setFollows((f) => ({ ...f, [m.id]: !following }))}
          className={cx("flex-1 h-[44px] rounded-[14px] text-[14px] font-black", following ? "bg-green-tint text-green" : "bg-green-2 text-cream-text")}
        >
          {following ? "✓ Following" : "Follow"}
        </button>
        <button
          aria-pressed={isMuted}
          onClick={() => setMuted((x) => ({ ...x, [m.id]: !isMuted }))}
          className={cx("h-[44px] px-4 rounded-[14px] border-2 text-[13px] font-black", isMuted ? "border-orange text-orange-3" : "border-line text-ink-2")}
        >
          {isMuted ? "Muted" : "Mute"}
        </button>
        <button onClick={() => setReport(true)} className="h-[44px] px-4 rounded-[14px] border-2 border-line text-ink-2 text-[13px] font-black">Report</button>
      </div>
      {isMuted && <p className="mt-2 text-[11px] font-bold text-ink-4">You won&apos;t see {m.name.split(" ")[0]}&apos;s posts in your feed.</p>}

      <div className="mt-4 text-[11px] font-extrabold text-ink-3 tracking-[0.3px] uppercase">Badges</div>
      <div className="mt-2 flex gap-2">
        {m.badges.map((b, i) => (
          <span key={i} className="w-12 h-12 rounded-full bg-card border-2 border-green-line flex items-center justify-center text-[20px]">{b}</span>
        ))}
      </div>

      {!youth && (
        <>
          <div className="mt-4 text-[11px] font-extrabold text-ink-3 tracking-[0.3px] uppercase">Favourite companies</div>
          <div className="mt-2 flex gap-[7px] flex-wrap">
            {m.favorites.map((s) => (
              <Link key={s} href={`/markets/${s}`} className="bg-green-tint text-green rounded-[9px] px-[11px] py-[5px] text-[12px] font-black">{s}</Link>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 text-[11px] font-extrabold text-ink-3 tracking-[0.3px] uppercase">Ideas by {m.name.split(" ")[0]}</div>
      {ideas.length === 0 ? (
        <div className="mt-2"><EmptyState emoji="💡" title="No ideas posted yet" body={youth ? "Young learners share ideas inside their family group." : `${m.name.split(" ")[0]} is still researching — check back soon.`} /></div>
      ) : (
        ideas.map((i) => <IdeaCard key={i.id} idea={i} />)
      )}

      <Sheet open={report} onClose={() => { setReport(false); setReported(false); }} title="Report this member">
        {reported ? (
          <div className="py-4 text-center">
            <div className="text-[28px]">🛡️</div>
            <div className="mt-2 text-[15px] font-black text-ink">Thanks, our moderators will review.</div>
            <p className="mt-1 text-[12.5px] font-bold text-ink-3">Reports are confidential. You can also mute this member.</p>
          </div>
        ) : (
          <ul>
            {REASONS.map((r) => (
              <li key={r}>
                <button onClick={() => setReported(true)} className="w-full text-left py-3 border-b border-paper-2 last:border-0 text-[13.5px] font-extrabold text-ink">{r}</button>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </div>
  );
}
