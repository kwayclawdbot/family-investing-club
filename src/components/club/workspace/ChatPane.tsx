"use client";
import Link from "next/link";
import { useState } from "react";
import { clubChat, type ClubChatMsg } from "@/lib/fixtures/v12-club";
import { useStored } from "../storage";
import { MemberDot, MiniSpark } from "./shared";

/** v11 — the private club is chat-default: my people, one conversation engine, rich artifacts. */
export function ChatPane({ proposal }: { proposal: { id: string; title: string; hoursLeft: number; voted: number; eligible: number } | null }) {
  const [local, setLocal] = useStored<ClubChatMsg[]>("fic.club.chat", []);
  const [draft, setDraft] = useState("");
  const msgs = [...clubChat, ...local];
  function send() {
    const t = draft.trim(); if (!t) return;
    setLocal([...local, { kind: "msg", id: `l${Date.now()}`, memberId: "kway", name: "Kway", text: t, mine: true }]);
    setDraft("");
  }
  return (
    <div className="flex flex-col min-h-[calc(100dvh-230px)] sm:min-h-[610px]">
      {proposal && (
        <div className="mt-[9px] bg-purple-tint border border-[#DDD4F0] rounded-[12px] px-3 py-2 flex items-center gap-[9px]">
          <span className="text-[13px]">🗳</span>
          <span className="flex-1 text-[11px] font-extrabold text-ink">{(proposal.title.match(/[A-Z]{2,5}/) ?? ["Club"])[0]} vote closes in {proposal.hoursLeft}h · {proposal.voted}/{proposal.eligible} in</span>
          <Link href={`/club/vote/${proposal.id}`} className="bg-purple text-cream-text rounded-[9px] px-[11px] py-[5px] text-[10px] font-black">Vote</Link>
        </div>
      )}
      <div className="mt-[10px] text-center text-[9px] font-extrabold text-ink-4">— TODAY —</div>
      <div className="mt-[7px] flex flex-col gap-[9px]">
        {msgs.map((m) =>
          m.kind === "system" ? (
            <div key={m.id} className="flex justify-center"><span className="bg-[#FFFDF4] border border-[#F0E0AE] rounded-[16px] px-[13px] py-[5px] text-[10px] font-extrabold text-[#8A6F3C]">{m.text}</span></div>
          ) : m.mine ? (
            <div key={m.id} className="flex gap-2 justify-end">
              <div className="max-w-[82%]">
                <div className="bg-green-2 rounded-[13px_3px_13px_13px] px-3 py-2 text-[12px] font-semibold text-cream-text leading-[1.4]">{m.text}</div>
                {m.readBy && <div className="text-right text-[8.5px] font-extrabold text-ink-4 mt-[2px]">read by {m.readBy}</div>}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2">
              <MemberDot memberId={m.memberId} size={28} />
              <div className="max-w-[82%]">
                <div className="bg-card border border-line rounded-[3px_13px_13px_13px] px-3 py-2">
                  <div className="text-[10px] font-black text-ink">{m.name}{m.grad ? " 🎓" : ""}</div>
                  <div className="text-[12px] font-semibold text-ink leading-[1.4] mt-[2px]">{m.text}</div>
                  {m.artifact && (
                    <div className="mt-1 flex items-center gap-2 bg-[#FBF6EA] border border-[#EFE4CF] rounded-[9px] px-[9px] py-[6px]">
                      <span className="w-6 h-6 rounded-[7px] bg-green-tint text-green text-[7px] font-black flex items-center justify-center">{m.artifact.symbol}</span>
                      <span className="text-[10px] font-black text-ink">{m.artifact.text}</span>
                      <MiniSpark up width={30} height={12} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-auto pt-3 pb-3">
        <div className="flex items-center gap-[9px] bg-card border-[1.5px] border-line rounded-[14px] px-[14px] py-[8px]">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message the club…" className="flex-1 bg-transparent text-[12px] font-bold text-ink placeholder:text-ink-4 outline-none" />
          <Link href="/club/pick/new" aria-label="Attach a pick" className="text-[12px]">▲</Link>
          <Link href="/club/propose" aria-label="Attach a proposal" className="text-[12px]">🗳</Link>
          <button type="submit" aria-label="Send" className="w-7 h-7 rounded-full bg-green-2 text-cream-text flex items-center justify-center text-[12px]">➤</button>
        </div>
      </form>
    </div>
  );
}
