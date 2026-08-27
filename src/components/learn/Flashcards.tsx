"use client";
import Link from "next/link";
import { useState } from "react";
import type { Flashcard } from "@/lib/types";
import { Button, ButtonLink, cx } from "@/components/ui";
import { ChevronLeft } from "@/components/ui/icons";

const title = (slug: string) => slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

/** Artboard 20 — Daily Review (spaced repetition): flip → rate Again / Hard / Good / Easy. Again + Hard return to the deck. */
export function Flashcards({ cards }: { cards: Flashcard[] }) {
  const [deck, setDeck] = useState(cards);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [got, setGot] = useState(0);
  const [again, setAgain] = useState(0);
  const card = deck[i];
  const done = i >= deck.length;

  function rate(grade: "again" | "hard" | "good" | "easy") {
    if (grade === "good" || grade === "easy") setGot((g) => g + 1);
    else { setAgain((a) => a + 1); setDeck((d) => [...d, card]); }
    setFlipped(false);
    setI(i + 1);
  }
  function restart() { setDeck(cards); setI(0); setFlipped(false); setGot(0); setAgain(0); }

  if (done) {
    return (
      <div className="pt-[18px] pb-6 flex flex-col min-h-full">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <div className="text-[56px] leading-none motion-safe:animate-[pop_.4s_ease-out]" aria-hidden>🧠</div>
          <h1 className="mt-4 text-[24px] font-black text-ink">Review complete</h1>
          <p className="mt-1 text-[14px] font-bold text-ink-3">{deck.length} cards · {again} came back around</p>
          <div className="flex gap-3 mt-5 w-full">
            <div className="flex-1 rounded-[14px] border border-green-line bg-green-tint py-3"><div className="text-[22px] font-black text-green">{got}</div><div className="text-[10.5px] font-extrabold text-green uppercase">Known</div></div>
            <div className="flex-1 rounded-[14px] border border-orange-line bg-orange-tint py-3"><div className="text-[22px] font-black text-orange-3">{again}</div><div className="text-[10.5px] font-extrabold text-orange-3 uppercase">Needs work</div></div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-[20px] bg-purple-tint px-4 py-2 text-[14px] font-black text-purple-2">⭐ +{got * 5} XP</div>
        </div>
        <div className="flex flex-col gap-2 mt-6">
          <Button onClick={restart} variant="green" full>Review again</Button>
          <ButtonLink href="/learn" variant="secondary" full>Back to Learn</ButtonLink>
        </div>
        <style>{`@keyframes pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}`}</style>
      </div>
    );
  }

  const gradeBtn = "flex-1 rounded-[13px] py-[11px] px-1 text-center text-[12.5px] font-black bg-card border-[1.5px] active:scale-[0.97] transition disabled:opacity-40";
  return (
    <div className="pt-[14px] pb-6 flex flex-col min-h-full">
      <div className="flex items-center justify-between">
        <Link href="/learn" aria-label="Back" className="text-ink-3"><ChevronLeft size={22} /></Link>
        <span className="text-[14px] font-black text-ink">Daily Review</span>
        <span className="text-[12px] font-extrabold text-ink-3">{i + 1} / {deck.length}</span>
      </div>
      <div className="flex gap-[5px] mt-3" aria-hidden>
        {deck.map((_, k) => <span key={k} className={cx("flex-1 h-[6px] rounded-[3px]", k < i ? "bg-green-2" : "bg-line-3")} />)}
      </div>

      <div className="relative mt-[26px] h-[340px]">
        <div className="absolute rounded-[20px] bg-[#F1E8D4]" style={{ inset: "14px -6px -14px 20px" }} />
        <div className="absolute rounded-[20px] bg-[#F7EFDD]" style={{ inset: "7px -13px -7px 10px" }} />
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-pressed={flipped}
          className={cx("relative w-full h-full rounded-[20px] border p-[26px] flex flex-col items-center justify-center text-center shadow-[0_6px_18px_rgba(46,42,33,0.08)] transition motion-safe:duration-200", flipped ? "bg-purple-tint border-purple-line" : "bg-card border-line")}
        >
          <span className="rounded-[9px] bg-purple-tint px-3 py-1 text-[10.5px] font-black text-purple-2 uppercase">{title(card.pathSlug)}</span>
          {flipped ? (
            <>
              <div className="mt-[18px] text-[16px] font-black text-purple-2">{card.term}</div>
              <p className="mt-[10px] text-[16px] font-bold text-ink leading-[1.5]">{card.definition}</p>
              <span className="mt-auto text-[12px] font-extrabold text-ink-4">Tap to flip back</span>
            </>
          ) : (
            <>
              <div className="mt-[18px] text-[24px] font-black text-ink">{card.term}</div>
              <p className="mt-[10px] text-[15px] font-semibold text-ink-2 leading-[1.5]">What does it mean — and why does it matter?</p>
              <span className="mt-auto text-[12px] font-extrabold text-ink-4">Tap to flip</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-[18px] text-center text-[11.5px] font-extrabold text-ink-3">HOW WELL DID YOU KNOW IT?</div>
      <div className="flex gap-2 mt-[9px]">
        <button disabled={!flipped} onClick={() => rate("again")} className={cx(gradeBtn, "border-[#E5B8AE] text-red")}>Again</button>
        <button disabled={!flipped} onClick={() => rate("hard")} className={cx(gradeBtn, "border-orange-line text-orange-2")}>Hard</button>
        <button disabled={!flipped} onClick={() => rate("good")} className={cx(gradeBtn, "border-green-line text-green")}>Good</button>
        <button disabled={!flipped} onClick={() => rate("easy")} className={cx(gradeBtn, "bg-green-tint border-2 border-green-2 text-green")}>Easy</button>
      </div>
      <p className="mt-[14px] text-center text-[12px] font-bold text-ink-4">Cards come from lessons you&apos;ve completed + weak concepts · +5 XP</p>
    </div>
  );
}
