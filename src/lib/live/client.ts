"use client";
/** Browser-side wrappers for the club mutation routes. Sheets can swap localStorage for these. */
type Res<T = { id?: string }> = ({ ok: true } & T) | { ok: false; error: string };

async function post<T = { id?: string }>(path: string, body?: unknown, method: "POST" | "PATCH" | "DELETE" = "POST"): Promise<Res<T>> {
  try {
    const url = path.startsWith("/") ? `/api${path}` : `/api/club/${path}`;
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: j.error ?? `HTTP ${r.status}` };
    return { ok: true, ...j };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" };
  }
}

export const api = {
  createClub: (b: { name: string; kind?: "family" | "friends" | "mixed"; privacy?: "private" | "public" }) => post<{ id: string; inviteCode: string }>("create", b),
  joinClub: (code: string) => post<{ id: string }>("join", { code }),
  pick: (b: { symbol: string; companyName?: string; stance: "buy" | "watch" | "pass"; reason: string; horizon: "1y" | "3y" | "5y+"; confidence: number; visibility?: "club" | "public" }) => post<{ id: string; xp: number }>("pick", b),
  react: (pickId: string, kind: "agree" | "not_sure") => post("pick/react", { pickId, kind }),
  reply: (pickId: string, body: string) => post<{ id: string }>("pick/reply", { pickId, body }),
  propose: (b: { kind: "add" | "remove" | "resize"; symbol: string; companyName?: string; fromWeightPct?: number; toWeightPct: number; rationale: string; evidence?: { label: string; href: string }[]; windowDays?: number }) => post<{ id: string }>("propose", b),
  vote: (proposalId: string, vote: "for" | "against") => post<{ status: string }>("vote", { proposalId, vote }),
  ask: (question: string, symbol?: string) => post<{ id: string; xp: number }>("ask", { question, symbol }),
  research: (b: { symbol: string; companyName?: string; assigneeId?: string | null; reason?: string }) => post<{ id: string }>("research", b),
  researchUpdate: (b: { id: string; status?: "open" | "ready" | "done"; notes?: string; assigneeId?: string | null }) => post("research", b, "PATCH"),
  brokerage: (b: { provider: string; accountLabel?: string; sharing?: "private" | "positions" | "allocation" | "full"; publicBadge?: boolean }) => post("brokerage", b),
  disconnectBrokerage: () => post("brokerage", undefined, "DELETE"),
  xp: (kind: string, amount: number, refId?: string) => post<{ xp: number }>("xp", { kind, amount, refId }),
  /* identity / tenant (Phase 1) */
  ensureFamily: (b: { name?: string; kind?: "family" | "friends" | "mixed"; privacy?: "private" | "public"; displayName?: string }) => post<{ id: string; name: string; inviteCode: string; familyId: string | null }>("/onboarding/family", b),
  completeOnboarding: (b: { level?: string; goals?: string[]; daily?: number | null; reminder?: boolean; weeklyHabit?: boolean; start?: string; who?: string }) => post<{ inviteCode: string | null }>("/onboarding/complete", b),
  invite: (b: { role: "child" | "parent"; ageGroup?: "kids" | "teens"; email?: string }) => post<{ id: string; code: string; expiresAt: string }>("/family/invite", b),
  join: (code: string, displayName?: string) => post<{ kind: "family" | "club"; club: { id: string; name: string } }>("/family/join", { code, displayName }),
};
