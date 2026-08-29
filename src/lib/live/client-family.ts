"use client";
/** Browser-side wrappers for the household / profile routes (same shape as `src/lib/live/client.ts`). */
type Res<T = Record<string, never>> = ({ ok: true } & T) | { ok: false; error: string };

async function call<T = Record<string, never>>(path: string, body?: unknown, method: "POST" | "PATCH" | "DELETE" = "POST"): Promise<Res<T>> {
  try {
    const r = await fetch(`/api/family${path}`, { method, headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" }, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: j.error ?? `HTTP ${r.status}` };
    return { ok: true, ...j };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" };
  }
}

export type GuardrailSetting = "chat_family_only" | "downtime_enabled" | "downtime_start_hour" | "downtime_end_hour" | "daily_limit_min" | "live_listen_only" | "tz";

export const familyApi = {
  /* household */
  invite: (b: { role: "child" | "parent"; ageGroup?: "kids" | "teens"; email?: string }) => call<{ id: string; code: string; expiresAt: string }>("/invite", b),
  revokeInvite: (id: string) => call("/invite", { id }, "DELETE"),
  join: (code: string, displayName?: string) => call<{ kind: "family" | "club"; familyId?: string; role?: string; club: { id: string; name: string } }>("/join", { code, displayName }),
  updateMember: (b: { id: string; displayName?: string; ageGroup?: "kids" | "teens" }) => call("/members", b, "PATCH"),
  removeMember: (id: string) => call("/members", { id }, "DELETE"),
  guardrail: (childId: string, setting: GuardrailSetting, value: boolean | number | string | null) => call<{ guardrails: Record<string, unknown> }>("/guardrail", { childId, setting, value }),
  note: (childId: string, note: string, week?: number) => call<{ week: number }>("/note", { childId, note, week }),
  /* research list + tonight */
  addCompany: (b: { symbol: string; companyName?: string; why?: string; howTheyMakeMoney?: string; whatTheySell?: string; strength?: string; risk?: string; status?: "watch" | "study" }) => call<{ id: string; updated: boolean }>("/watchlist", b),
  removeCompany: (id: string) => call("/watchlist", { id }, "DELETE"),
  vote: (ticker: string) => call<{ night: string; ticker: string; xp: number }>("/watchlist/vote", { ticker }),
  clearVote: () => call("/watchlist/vote", undefined, "DELETE"),
  recordNight: (b: { night: string; attendeeIds: string[]; ticker?: string; companyName?: string }) => call<{ night: string; xpPerAttendee: number; results: { id: string; awarded: boolean; alreadyAwarded: boolean; xp: number }[]; transcript: boolean }>("/night", b),
  completeMission: (slug: string, evidence?: string) => call<{ alreadyDone: boolean; xp: number }>("/mission", { slug, evidence }),
  ping: () => call<{ minutes: number; limit: number | null; locked: boolean }>("/activity"),
  /* me */
  updateMe: (b: { displayName?: string; username?: string; comprehensionLevel?: "beginner" | "developing" | "proficient" | null; notificationPrefs?: Record<string, unknown>; avatarUrl?: string | null }) => call<Record<string, unknown>>("/me", b, "PATCH"),
  changePassword: (password: string) => call("/me/password", { password }),
  uploadAvatar: (file: File) => { const f = new FormData(); f.append("file", file); return call<{ avatarUrl: string }>("/me/avatar", f); },
};
