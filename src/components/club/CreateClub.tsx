"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Club } from "@/lib/types";
import { cx } from "@/components/ui";
import { Sheet, Toggle } from "@/components/ui/extras";
import { Eyebrow, Raised, ScreenHeader, useStoredClub } from "./club-shared";
import { write } from "./storage";

const VOTE_RULES: { id: Club["rules"]["votes"]; label: string; sub: string }[] = [
  { id: "majority", label: "Majority", sub: "More than half of the votes cast" },
  { id: "unanimous", label: "Unanimous", sub: "Everyone who votes must agree" },
  { id: "founder", label: "Founder decides", sub: "Votes advise; the founder executes" },
];
const PROMPTS = ["Thu 7 PM", "Sun 6 PM", "Sat 10 AM", "Off"];

/** Artboard 01 — one screen, decisions preset. */
export function CreateClub({ defaults }: { defaults: Club }) {
  const router = useRouter();
  const [stored] = useStoredClub();
  const [name, setName] = useState(stored.name ?? defaults.name);
  const [kind, setKind] = useState<Club["kind"]>(stored.kind ?? "family");
  const [privacy, setPrivacy] = useState<Club["privacy"]>(stored.privacy ?? "private");
  const [votes, setVotes] = useState<Club["rules"]["votes"]>(stored.votes ?? "majority");
  const [kids, setKids] = useState(stored.kidsCanVote ?? true);
  const [prompt, setPrompt] = useState(stored.prompt ?? defaults.rules.weeklyPrompt);
  const [sheet, setSheet] = useState<"votes" | "prompt" | null>(null);

  function create() {
    write("fic.club", { name: name.trim() || defaults.name, kind, privacy, votes, kidsCanVote: kids, prompt });
    write("fic.club.new", "1");
    router.push("/club?state=new");
  }
  const chip = (on: boolean) => cx("rounded-[20px] px-[15px] py-2 text-[12.5px] transition", on ? "bg-green-tint border-2 border-green-2 text-ink font-black" : "bg-card border-[1.5px] border-line text-ink-2 font-extrabold");

  return (
    <div className="flex flex-col min-h-full px-[2px]">
      <ScreenHeader backHref="/club" title="Create your club" />
      <div className="flex gap-[14px] items-center mt-[18px]">
        <button type="button" className="w-[74px] h-[74px] rounded-[22px] art-placeholder border-2 border-dashed border-[#A9C69E] flex flex-col items-center justify-center shrink-0" aria-label="Add club photo">
          <span className="text-[18px]">📷</span>
          <span className="text-[8.5px] font-extrabold text-green-3">add photo</span>
        </button>
        <label className="flex-1 min-w-0">
          <Eyebrow>CLUB NAME</Eyebrow>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-[6px] w-full bg-card border-2 border-green-2 rounded-[13px] px-[15px] py-3 text-[15px] font-extrabold text-ink outline-none" />
        </label>
      </div>

      <Eyebrow className="mt-4">WHO&apos;S IT FOR?</Eyebrow>
      <div className="flex gap-2 mt-2" role="radiogroup">
        {([["family", "👨‍👩‍👧‍👦 Family"], ["friends", "Friends"], ["mixed", "Mixed"]] as const).map(([id, label]) => (
          <button key={id} role="radio" aria-checked={kind === id} onClick={() => setKind(id)} className={chip(kind === id)}>{label}</button>
        ))}
      </div>

      <Eyebrow className="mt-[14px]">PRIVACY</Eyebrow>
      <div className="flex flex-col gap-[9px] mt-2" role="radiogroup">
        {([["private", "🔒", "Private", "Invite-only. Picks, votes & talk stay inside."], ["public", "🌍", "Public", "Anyone can follow · picks visible to the network"]] as const).map(([id, emoji, t, sub]) => {
          const on = privacy === id;
          return (
            <button key={id} role="radio" aria-checked={on} onClick={() => setPrivacy(id)} className={cx("bg-card rounded-[14px] px-[15px] py-3 flex items-center gap-[11px] text-left", on ? "border-2 border-green-2" : "border-[1.5px] border-line")}>
              <span className="text-[17px]">{emoji}</span>
              <span className="flex-1">
                <span className="block text-[13.5px] font-extrabold text-ink">{t}</span>
                <span className="block text-[11px] font-bold text-ink-3">{sub}</span>
              </span>
              {on && <span className="w-5 h-5 rounded-full bg-green-2 text-white text-[11px] font-black flex items-center justify-center">✓</span>}
            </button>
          );
        })}
      </div>

      <Eyebrow className="mt-[14px]">HOW DECISIONS WORK · CHANGE ANYTIME</Eyebrow>
      <div className="mt-2 bg-card border border-line rounded-[16px] px-[15px] py-[2px]">
        <button onClick={() => setSheet("votes")} className="w-full flex justify-between items-center py-[11px] border-b border-paper-2">
          <span className="text-[13px] font-extrabold text-ink">Portfolio votes</span>
          <span className="text-[12px] font-extrabold text-ink-3">{VOTE_RULES.find((v) => v.id === votes)?.label} ›</span>
        </button>
        <div className="flex justify-between items-center py-[11px] border-b border-paper-2">
          <span className="text-[13px] font-extrabold text-ink">Kids can vote</span>
          <Toggle checked={kids} onChange={setKids} label="Kids can vote" />
        </div>
        <button onClick={() => setSheet("prompt")} className="w-full flex justify-between items-center py-[11px]">
          <span className="text-[13px] font-extrabold text-ink">Weekly club prompt</span>
          <span className="text-[12px] font-extrabold text-ink-3">{prompt} ›</span>
        </button>
      </div>

      <div className="mt-auto pt-6 pb-[44px]">
        <Raised tone="green" onClick={create}>Create Club → Invite</Raised>
      </div>

      <Sheet open={sheet === "votes"} onClose={() => setSheet(null)} title="Portfolio votes">
        <div className="flex flex-col gap-2">
          {VOTE_RULES.map((v) => (
            <button key={v.id} onClick={() => { setVotes(v.id); setSheet(null); }} className={cx("text-left rounded-[12px] px-4 py-3 border", votes === v.id ? "bg-green-tint border-green-2" : "bg-paper border-line")}>
              <div className="text-[13.5px] font-black text-ink">{v.label}</div>
              <div className="text-[11.5px] font-bold text-ink-3">{v.sub}</div>
            </button>
          ))}
        </div>
      </Sheet>
      <Sheet open={sheet === "prompt"} onClose={() => setSheet(null)} title="Weekly club prompt">
        <p className="text-[12.5px] font-bold text-ink-3 mb-3">A light weekly nudge — Family Investing Night or a research check-in.</p>
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button key={p} onClick={() => { setPrompt(p); setSheet(null); }} className={chip(prompt === p)}>{p}</button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
