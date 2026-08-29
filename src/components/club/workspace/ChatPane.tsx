"use client";
import { KaiSummaryRow } from "./OfficialPicks";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { clubApi, signedOut } from "@/lib/live/client-club";
import type { ClubChatMessage } from "@/lib/live/club";
import { clubChat, type ClubChatMsg } from "@/lib/fixtures/v12-club";
import { useStored } from "../storage";
import { MemberDot, MiniSpark } from "./shared";
import { circles, fmtPeople } from "@/lib/fixtures/v12-social";
import { sarahAmznMsg } from "@/lib/fixtures/v13-club";
import { openSheet } from "@/components/sheets/bus";
import { BeltChip } from "@/components/ui/belt";
import { BELTS } from "@/lib/fixtures/belts";

/** v11 — the private club is chat-default: my people, one conversation engine, rich artifacts. */
export function ChatPane({ proposal, live }: { proposal: { id: string; title: string; hoursLeft: number; voted: number; eligible: number } | null; live?: ClubChatMessage[] | null }) {
  const router = useRouter();
  const [local, setLocal] = useStored<ClubChatMsg[]>("fic.club.chat", []);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [echo, setEcho] = useState<ClubChatMsg[]>([]);
  const [attach, setAttach] = useState(false);
  // Signed in → the family thread from the database; signed out (demo) → the fixture conversation.
  const msgs: ClubChatMsg[] = live
    ? [...live.map((m): ClubChatMsg => ({ kind: m.kind === "system" ? "system" : "msg", id: m.id, memberId: m.authorId ?? "club", name: m.author, text: m.text, mine: m.mine })), ...echo]
    : [...clubChat, ...local];
  async function send() {
    const t = draft.trim(); if (!t || busy) return;
    setBusy(true); setError(null);
    const r = await clubApi.chat(t);
    setBusy(false);
    if (r.ok) { setDraft(""); setEcho((x) => [...x, { kind: "msg", id: `s${Date.now()}`, memberId: "me", name: "You", text: t, mine: true }]); router.refresh(); return; }
    if (signedOut(r)) { setLocal([...local, { kind: "msg", id: `l${Date.now()}`, memberId: "kway", name: "Kway", text: t, mine: true }]); setDraft(""); return; }
    setError(r.error);
  }
  return (
    <div className="flex flex-col min-h-[calc(100dvh-230px)] sm:min-h-[610px]">
      <div className="flex gap-[10px] mt-[10px] overflow-x-auto no-scrollbar -mx-[18px] px-[18px]" aria-label="Circles">
        {circles.map((c) => (
          <Link key={c.id} href={`/circle/${c.id}`} className="flex flex-col items-center w-[58px] shrink-0">
            <span className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-[18px] border-[2.5px]" style={{ background: c.tint, borderColor: c.color }}>{c.emoji}</span>
            <span className="mt-1 text-[8.5px] font-black text-ink text-center leading-tight truncate w-full">{c.name}</span>
            <span className="text-[8px] font-extrabold text-ink-4">{c.daysLeft}d · {fmtPeople(c.people)}</span>
          </Link>
        ))}
      </div>
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
        <div className="flex gap-2">
          <span className="w-7 h-7 rounded-full bg-coral text-white text-[11px] font-black flex items-center justify-center shrink-0 ring-2 ring-[#3E7BC7] ring-offset-2 ring-offset-paper">S</span>
          <div className="max-w-[82%]">
            <div className="bg-card border border-line rounded-[3px_13px_13px_13px] px-3 py-2">
              <div className="flex items-center gap-[6px] text-[10px] font-black text-ink">{sarahAmznMsg.name} <BeltChip belt={BELTS[4]} /></div>
              <div className="text-[12px] font-semibold text-ink leading-[1.4] mt-[2px]">{sarahAmznMsg.text.split("$AMZN")[0]}<Link href="/discover/AMZN" className="text-green font-black">$AMZN</Link>{sarahAmznMsg.text.split("$AMZN")[1]}</div>
              <Link href={sarahAmznMsg.artifact.href} className="mt-1 flex items-center gap-2 bg-[#FBF6EA] border border-[#EFE4CF] rounded-[9px] px-[9px] py-[6px]">
                <span className="w-6 h-6 rounded-[7px] bg-green-tint text-green text-[7px] font-black flex items-center justify-center">{sarahAmznMsg.artifact.symbol}</span>
                <span className="text-[10px] font-black text-ink">{sarahAmznMsg.artifact.line}</span>
                <MiniSpark up width={30} height={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
      {attach && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end" role="dialog" aria-label="Add to your message">
          <button aria-label="Cancel" onClick={() => setAttach(false)} className="absolute inset-0 bg-[#2E2A21]/45" />
          <div className="relative bg-paper rounded-t-[24px] px-[18px] pt-3 pb-6">
            <div className="mx-auto w-10 h-[5px] rounded-full bg-line-3" />
            <div className="mt-3 text-[15px] font-black text-ink">Add to your message</div>
            {[
              ["📷", "Photo or video", "camera roll or record now", () => setAttach(false)],
              ["📈", "Trade idea", "structured pick card — ticker, stance, why", () => { setAttach(false); openSheet("pick", { symbol: "NVDA" }); }],
              ["📊", "Poll", "let the club vote on anything", () => { setAttach(false); openSheet("compose", { audience: "club" }); }],
              ["📎", "Research artifact", "attach a thesis, chart or Kai summary", () => { setAttach(false); openSheet("compose", { audience: "club" }); }],
            ].map(([e, t, sub, fn]) => (
              <button key={t as string} onClick={fn as () => void} className="mt-2 w-full flex items-center gap-3 bg-card border border-line rounded-[14px] px-3 py-[10px] text-left">
                <span className="w-9 h-9 rounded-[10px] bg-paper-2 flex items-center justify-center text-[17px]">{e as string}</span>
                <span className="flex-1"><span className="block text-[13px] font-black text-ink">{t as string}</span><span className="block text-[10.5px] font-bold text-ink-3">{sub as string}</span></span>
                <span className="text-ink-4">›</span>
              </button>
            ))}
            <button onClick={() => setAttach(false)} className="mt-3 w-full h-11 rounded-[14px] bg-card border border-line text-[13px] font-black text-ink-2">Cancel</button>
          </div>
        </div>
      )}
      <div className="mt-auto"><KaiSummaryRow /></div>
      <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="pt-3 pb-3">
        {error && <p role="alert" className="mb-[6px] text-[11px] font-bold text-coral px-1">{error}</p>}
        <div className="flex items-center gap-[9px] bg-card border-[1.5px] border-line rounded-[14px] px-[14px] py-[8px]">
          <input value={draft} onChange={(e) => { setDraft(e.target.value); if (error) setError(null); }} placeholder="Message the club…" aria-label="Message the club" className="flex-1 bg-transparent text-[12px] font-bold text-ink placeholder:text-ink-4 outline-none" />
          <button type="button" onClick={() => setAttach(true)} aria-label="Attach" className="text-[15px] font-black text-ink-3">＋</button>
          <button type="button" onClick={() => openSheet("compose", { audience: "club" })} aria-label="Share something" className="text-[13px] text-ink-3">✎</button>
          <button type="submit" aria-label="Send" disabled={busy || !draft.trim()} className="w-7 h-7 rounded-full bg-green-2 text-cream-text flex items-center justify-center text-[12px] disabled:opacity-40">➤</button>
        </div>
      </form>
    </div>
  );
}
