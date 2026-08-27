"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Club, Comment, Pick } from "@/lib/types";
import { cx } from "@/components/ui";
import { Sheet } from "@/components/ui/extras";
import { SendIcon } from "@/components/ui/icons";
import { avatarFor } from "./MyClub";
import { Chip, MemberAvatar, ScreenHeader, StanceTag, dots } from "./club-shared";
import { newId, read, useStored } from "./storage";

/** Artboard 02 — a Pick's discussion thread with the Kai summarize bridge. */
export function PickThread({ pick: initial, club, id }: { pick?: Pick; club: Club; id: string }) {
  const [pick, setPick] = useState<Pick | undefined>(initial);
  useEffect(() => {
    if (initial) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate a locally-made pick after mount
    setPick(read<Pick[]>("fic.picks", []).find((p) => p.id === id));
  }, [id, initial]);
  const [reaction, setReaction] = useStored<"agree" | "notsure" | null>(`fic.agree.${id}`, null);
  const [localReplies, setLocalReplies] = useStored<Comment[]>(`fic.replies.${id}`, []);
  const [text, setText] = useState("");
  const [sum, setSum] = useState(false);

  if (!pick) return <div className="pt-16 text-center text-[13px] font-bold text-ink-3">This pick isn&apos;t on this device.</div>;
  const replies = [...pick.replies, ...localReplies];
  const isMine = pick.authorId === "kway";
  const possessive = isMine ? "Your Pick" : `${pick.author}’s Pick`;
  const agree = pick.agree + (reaction === "agree" ? 1 : 0);
  const notSure = pick.notSure + (reaction === "notsure" ? 1 : 0);

  function send() {
    const t = text.trim();
    if (!t) return;
    setLocalReplies([...localReplies, { id: newId("r"), author: "Kway", ago: "now", text: t }]);
    setText("");
  }
  const bear = replies.find((r) => /price|expensive|paying|p\/e/i.test(r.text));

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader backHref="/club" title={`Pick · ${club.shortName}`} center />

      <div className="mt-3 bg-card border border-line rounded-[16px] px-[15px] py-[13px]">
        <div className="flex items-center gap-[10px]">
          <MemberAvatar m={avatarFor(club, pick.authorId, pick.author)} size={34} />
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-black text-ink">{possessive}</div>
            <div className="text-[10.5px] font-bold text-ink-3">{pick.ago === "now" ? "just now" : `${pick.ago} ago`} · {pick.visibility === "club" ? "visible to club only" : "public"}</div>
          </div>
          <StanceTag symbol={pick.symbol} stance={pick.stance} size="md" />
        </div>
        <div className="mt-[9px] text-[14px] font-bold text-ink leading-[1.45]">&quot;{pick.reason}&quot;</div>
        <div className="flex gap-[7px] mt-[9px] flex-wrap">
          <Chip>{pick.horizon} horizon</Chip>
          <Chip>confidence {dots(pick.confidence)}</Chip>
          <Chip>${pick.priceAtPick.toLocaleString()} at pick</Chip>
        </div>
        <div className="flex gap-2 mt-[11px]">
          <button aria-pressed={reaction === "agree"} onClick={() => setReaction(reaction === "agree" ? null : "agree")} className={cx("flex-1 rounded-[11px] py-2 text-[12px] font-black transition", reaction === "agree" || (reaction === null && agree > 0) ? "bg-green-tint border-[1.5px] border-[#A9C69E] text-green" : "bg-card border-[1.5px] border-line text-ink-2")}>👍 Agree · {agree}</button>
          <button aria-pressed={reaction === "notsure"} onClick={() => setReaction(reaction === "notsure" ? null : "notsure")} className={cx("flex-1 rounded-[11px] py-2 text-[12px] font-black transition", reaction === "notsure" ? "bg-orange-tint border-[1.5px] border-orange-line text-orange-2" : "bg-card border-[1.5px] border-line text-ink-2")}>🤔 Not sure · {notSure}</button>
        </div>
      </div>

      {replies.map((r) => (
        <div key={r.id} className="mt-[10px] flex gap-[9px]">
          <MemberAvatar m={avatarFor(club, r.author.toLowerCase(), r.author)} size={30} />
          <div className="flex-1 bg-card border border-line rounded-[4px_15px_15px_15px] px-[13px] py-[10px] text-[12.5px] font-semibold text-ink leading-[1.45]">
            <b className="font-black">{r.author}</b> · {r.ago}<br />{r.text}
          </div>
        </div>
      ))}
      {replies.length === 0 && <p className="mt-3 text-center text-[12px] font-bold text-ink-4">No replies yet — ask the club what they think.</p>}

      <div className="mt-[10px] bg-purple-tint border border-[#DDD4F0] rounded-[14px] px-[14px] py-[11px] flex items-center gap-[10px]">
        <span className="w-7 h-7 rounded-[10px] bg-purple text-white text-[13px] flex items-center justify-center shrink-0">✦</span>
        <span className="flex-1 text-[12px] font-bold text-[#584A93]">Kai can summarize both sides + the P/E concept for everyone</span>
        <button onClick={() => setSum(true)} className="bg-purple text-cream-text rounded-[9px] px-[11px] py-[6px] text-[10.5px] font-black">Summarize</button>
      </div>

      <div className="flex gap-2 mt-[10px]">
        <Link href={`/club/new?from=pick&symbol=${pick.symbol}`} className="flex-1 bg-card border-[1.5px] border-green-2 text-green rounded-[12px] py-[10px] text-center text-[12px] font-black">Grow into an Idea</Link>
        <Link href={`/club/propose?symbol=${pick.symbol}`} className="flex-1 bg-card border-[1.5px] border-[#DDD4F0] text-purple-2 rounded-[12px] py-[10px] text-center text-[12px] font-black">Propose to portfolio</Link>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-auto pt-4 pb-[14px]">
        <div className="flex items-center gap-[10px] bg-card border-[1.5px] border-line rounded-[15px] px-[15px] py-[9px]">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply to the club…" className="flex-1 bg-transparent text-[12.5px] font-bold text-ink outline-none placeholder:text-ink-4" />
          <button type="submit" aria-label="Send" disabled={!text.trim()} className="w-[30px] h-[30px] rounded-full bg-green-2 text-cream-text flex items-center justify-center disabled:opacity-50"><SendIcon size={14} /></button>
        </div>
      </form>

      <Sheet open={sum} onClose={() => setSum(false)} title="Both sides, plainly">
        <div className="text-[10.5px] font-black text-purple-2">DRAFT SUMMARY · KAI REVIEW ARRIVES WHEN THE TUTOR IS WIRED</div>
        <div className="mt-3 bg-green-tint border border-green-line rounded-[12px] px-3 py-[10px]">
          <div className="text-[10.5px] font-black text-green">THE CASE FOR ({pick.author})</div>
          <p className="mt-1 text-[12.5px] font-bold text-ink leading-[1.45]">{pick.reason}</p>
        </div>
        <div className="mt-2 bg-orange-tint border border-orange-line rounded-[12px] px-3 py-[10px]">
          <div className="text-[10.5px] font-black text-orange-2">THE WORRY{bear ? ` (${bear.author})` : ""}</div>
          <p className="mt-1 text-[12.5px] font-bold text-ink leading-[1.45]">{bear ? bear.text : "Nobody has pushed back yet — what could make this wrong?"}</p>
        </div>
        <div className="mt-2 bg-paper border border-line rounded-[12px] px-3 py-[10px]">
          <div className="text-[10.5px] font-black text-ink-3">THE CONCEPT · P/E RATIO</div>
          <p className="mt-1 text-[12.5px] font-bold text-ink-2 leading-[1.45]">Price divided by earnings per share — how many years of profit you&apos;re paying for. High P/E means the market expects fast growth; the bet is whether it arrives.</p>
          <Link href="/learn/path/company-analysis" className="inline-block mt-2 text-[12px] font-black text-green">4-min lesson →</Link>
        </div>
      </Sheet>
    </div>
  );
}
