"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Flashcard } from "@/lib/types";
import { Button, ButtonLink, cx } from "@/components/ui";
import { ConceptChip } from "@/components/ui/extras";
import { ChevronLeft } from "@/components/ui/icons";

/** Flashcard review session: flip → rate confidence. "Still learning" cards return at the end of the deck. */
export function Flashcards({ cards }: { cards: Flashcard[] }) {
  const router = useRouter();
  const [deck, setDeck] = useState(cards);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [got, setGot] = useState(0);
  const [again, setAgain] = useState(0);
  const [seen, setSeen] = useState(0);
  const total = cards.length;
  const card = deck[i];
  const done = i >= deck.length;

  function rate(ok: boolean) {
    if (ok) setGot((g) => g + 1);
    else {
      setAgain((a) => a + 1);
      setDeck((d) => [...d, card]);
    }
    setSeen((s) => s + 1);
    setFlipped(false);
    setI(i + 1);
  }
  function restart() {
    setDeck(cards); setI(0); setFlipped(false); setGot(0); setAgain(0); setSeen(0);
  }

  if (done) {
    return (
      <div className="pt-[18px] pb-6 flex flex-col min-h-full">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <div className="text-[56px] leading-none motion-safe:animate-[pop_.4s_ease-out]" aria-hidden>🧠</div>
          <h1 className="mt-4 text-[24px] font-black text-ink">Review complete</h1>
          <p className="mt-1 text-[14px] font-bold text-ink-3">You went through {seen} cards.</p>
          <div className="flex gap-3 mt-5 w-full">
            <div className="flex-1 rounded-[14px] border border-green-line bg-green-tint py-3">
              <div className="text-[22px] font-black text-green">{got}</div>
              <div className="text-[10.5px] font-extrabold text-green uppercase">Got it</div>
            </div>
            <div className="flex-1 rounded-[14px] border border-orange-line bg-orange-tint py-3">
              <div className="text-[22px] font-black text-orange-3">{again}</div>
              <div className="text-[10.5px] font-extrabold text-orange-3 uppercase">Still learning</div>
            </div>
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

  return (
    <div className="pt-[14px] pb-6 flex flex-col min-h-full">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} aria-label="Back" className="w-9 h-9 rounded-full bg-card border border-line flex items-center justify-center text-ink-2"><ChevronLeft /></button>
        <div className="text-[13px] font-extrabold text-ink-3">{Math.min(i + 1, deck.length)} / {deck.length}{deck.length > total ? ` · ${deck.length - total} repeat` : ""}</div>
        <span className="w-9" />
      </div>
      <div className="h-[8px] rounded-[4px] bg-line-2 overflow-hidden mt-3">
        <div className="h-full rounded-[4px] bg-purple transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${(i / deck.length) * 100}%` }} />
      </div>

      <div className="mt-6 text-[11px] font-extrabold text-ink-3 uppercase tracking-[0.3px] text-center">{flipped ? "Definition" : "Term · tap to flip"}</div>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        className={cx(
          "mt-3 w-full min-h-[240px] rounded-[22px] border p-6 flex flex-col items-center justify-center text-center transition motion-safe:duration-200 active:scale-[0.99]",
          flipped ? "bg-purple-tint border-purple-line" : "bg-card border-line shadow-[0_6px_18px_rgba(46,42,33,0.06)]"
        )}
      >
        {flipped ? (
          <>
            <div className="text-[16px] font-black text-purple-2">{card.term}</div>
            <p className="mt-3 text-[16px] font-bold text-ink leading-[1.5]">{card.definition}</p>
          </>
        ) : (
          <div className="text-[28px] font-black text-ink">{card.term}</div>
        )}
      </button>
      <div className="mt-3 flex justify-center">
        <ConceptChip label={card.concept} definition={card.definition} lessonHref={`/learn/path/${card.pathSlug}`} tone="purple" />
      </div>

      <div className="mt-auto pt-6">
        {flipped ? (
          <div className="flex gap-3">
            <Button onClick={() => rate(false)} variant="secondary" full className="border-orange-line text-orange-3">Still learning</Button>
            <Button onClick={() => rate(true)} variant="green" full>Got it ✓</Button>
          </div>
        ) : (
          <Button onClick={() => setFlipped(true)} variant="purple" full>Show definition</Button>
        )}
        <p className="mt-3 text-center text-[11.5px] font-bold text-ink-4">
          Cards come from lessons you finished · <Link href="/learn/library" className="text-green">Library</Link>
        </p>
      </div>
    </div>
  );
}
