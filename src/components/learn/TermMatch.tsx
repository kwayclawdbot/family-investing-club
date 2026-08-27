"use client";
import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink, cx } from "@/components/ui";

type Pair = { term: string; meaning: string };

function shuffle<T>(a: T[], seed: number) {
  const out = [...a];
  let x = seed;
  for (let i = out.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280;
    const j = Math.floor((x / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Term Match: tap a term, then its meaning. Correct pairs lock green; wrong flashes coral. */
export function TermMatch({ pairs, gameId }: { pairs: Pair[]; gameId: string }) {
  const [round, setRound] = useState(1);
  const terms = shuffle(pairs.map((p) => p.term), 7 + round);
  const meanings = shuffle(pairs.map((p) => p.meaning), 13 + round);
  const [term, setTerm] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [misses, setMisses] = useState(0);
  const [secs, setSecs] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const done = matched.length === pairs.length;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (done) { if (timer.current) clearInterval(timer.current); return; }
    timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [done, round]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(`fic.best.${gameId}`);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      if (v) setBest(Number(v));
    } catch { /* storage unavailable */ }
  }, [gameId]);

  const score = done ? Math.max(1, 10 - misses - Math.floor(secs / 20)) : 0;
  function persistBest(finalScore: number) {
    try {
      const prev = Number(localStorage.getItem(`fic.best.${gameId}`) ?? 0);
      if (finalScore > prev) { localStorage.setItem(`fic.best.${gameId}`, String(finalScore)); setBest(finalScore); }
    } catch { /* ignore */ }
  }

  function pickMeaning(m: string) {
    if (!term) return;
    const ok = pairs.find((p) => p.term === term)?.meaning === m;
    if (ok) {
      const nextMatched = [...matched, term];
      setMatched(nextMatched); setTerm(null);
      if (nextMatched.length === pairs.length) persistBest(Math.max(1, 10 - misses - Math.floor(secs / 20)));
    }
    else { setMisses((n) => n + 1); setWrong(m); setTimeout(() => setWrong(null), 350); setTerm(null); }
  }
  function again() { setRound((r) => r + 1); setMatched([]); setTerm(null); setMisses(0); setSecs(0); }

  const mm = String(Math.floor(secs / 60)).padStart(1, "0");
  const ss = String(secs % 60).padStart(2, "0");

  if (done) {
    return (
      <div className="flex flex-col items-center text-center pt-10 pb-6">
        <div className="text-[56px] leading-none" aria-hidden>🧩</div>
        <h1 className="mt-3 text-[24px] font-black text-ink">All matched!</h1>
        <p className="text-[14px] font-bold text-ink-3 mt-1">{mm}:{ss} · {misses} miss{misses === 1 ? "" : "es"}</p>
        <div className="mt-5 flex gap-3 w-full">
          <div className="flex-1 rounded-[14px] border border-line bg-card py-3"><div className="text-[22px] font-black text-green">{score}</div><div className="text-[10.5px] font-extrabold text-ink-3 uppercase">Score</div></div>
          <div className="flex-1 rounded-[14px] border border-line bg-card py-3"><div className="text-[22px] font-black text-gold">{best ?? score}</div><div className="text-[10.5px] font-extrabold text-ink-3 uppercase">Best</div></div>
        </div>
        <div className="mt-4 inline-flex items-center rounded-[20px] bg-purple-tint px-4 py-2 text-[14px] font-black text-purple-2">⭐ +{score * 2} XP</div>
        <div className="flex flex-col gap-2 mt-8 w-full">
          <Button onClick={again} variant="green" full>Play again</Button>
          <ButtonLink href="/learn/games" variant="secondary" full>All games</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between mt-1">
        <div className="text-[13px] font-extrabold text-ink-3">{matched.length} / {pairs.length} matched</div>
        <div className="text-[13px] font-black text-ink tabular-nums">⏱ {mm}:{ss}</div>
      </div>
      <p className="mt-2 text-[13px] font-bold text-ink-3">{term ? <>Now tap the meaning of <b className="text-ink">{term}</b></> : "Tap a term, then its meaning."}</p>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="flex flex-col gap-2">
          {terms.map((t) => {
            const isM = matched.includes(t);
            return (
              <button key={t} type="button" disabled={isM} onClick={() => setTerm(t)} aria-pressed={term === t}
                className={cx("min-h-[56px] rounded-[12px] border px-2 text-[13px] font-black transition", isM ? "bg-green-tint border-green-line text-green" : term === t ? "bg-purple-tint border-purple text-purple-2" : "bg-card border-line text-ink")}>{t}</button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {meanings.map((m) => {
            const isM = matched.some((t) => pairs.find((p) => p.term === t)?.meaning === m);
            return (
              <button key={m} type="button" disabled={isM || !term} onClick={() => pickMeaning(m)}
                className={cx("min-h-[56px] rounded-[12px] border px-2 text-[12px] font-bold leading-[1.3] transition", isM ? "bg-green-tint border-green-line text-green" : wrong === m ? "bg-[#F8E1DC] border-red text-red" : "bg-card border-line text-ink-2 disabled:opacity-60")}>{m}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
