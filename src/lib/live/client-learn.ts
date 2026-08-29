"use client";
/** Browser-side wrappers for the learn + practice mutation routes (same shape as `client.ts`). */
type Res<T = Record<string, never>> = ({ ok: true } & T) | { ok: false; error: string; status?: number };

async function post<T = Record<string, never>>(path: string, body?: unknown): Promise<Res<T>> {
  try {
    const r = await fetch(`/api${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, keepalive: true });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: j.error ?? `HTTP ${r.status}`, status: r.status };
    return { ok: true, ...j };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" };
  }
}

export type PracticeOrderResult = { order: { id: string; symbol: string; side: "buy" | "sell"; shares: number; price: number; at: string; thesis?: string; status: "filled" }; cash: number; pnl?: number; xp: number };

export const learnApi = {
  progress: (lessonId: string, pct: number) => post<{ status: string; pct: number }>("/learn/progress", { lessonId, pct }),
  complete: (lessonId: string, extra?: { stepTotal?: number; timeSpentSec?: number }) => post<{ xp: number; xpBefore: number; xpAfter: number; alreadyBanked: boolean }>("/learn/complete", { lessonId, ...extra }),
  step: (lessonId: string, stepIndex: number, stepState?: Record<string, unknown>) => post<{ stepIndex: number }>("/learn/step", { lessonId, stepIndex, stepState }),
  mastery: (skillId: string, correct: boolean) => post("/learn/mastery", { skillId, correct }),
  quiz: (quizId: string, selections: (number | null)[]) => post<{ attemptId: string; score: number; passed: boolean; correct: number; total: number; xp: number }>("/learn/quiz", { quizId, selections }),
  quizFromEngine: (quizId: string, engine: { score: number; correct: number; total: number }) => post<{ attemptId: string; score: number; passed: boolean; xp: number }>("/learn/quiz", { quizId, engine }),
  flashcard: (cardId: string, grade: "again" | "hard" | "good" | "easy") => post<{ dueAt: string; intervalDays: number; streak: number }>("/learn/flashcard", { cardId, grade }),
  flashcardFinish: (known: number, total: number) => post<{ xp: number; day: string }>("/learn/flashcard", { finish: true, known, total }),
  rsvp: (sessionId: string, on: boolean) => post<{ rsvped: boolean; xp: number }>("/learn/rsvp", { sessionId, on }),
  realWorld: (action: "save_watchlist" | "research_ticker", ticker: string) => post<{ done: boolean; via?: string }>("/learn/real-world", { action, ticker }),
};

export const practiceApi = {
  order: (b: { symbol: string; side: "buy" | "sell"; shares: number; thesis?: string }) => post<PracticeOrderResult>("/practice/order", b),
};
