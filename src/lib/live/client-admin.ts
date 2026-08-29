"use client";
/** Browser wrappers for /api/admin/* (same shape as src/lib/live/client.ts). Every route is admin-gated server-side. */
type Res<T = Record<string, unknown>> = ({ ok: true } & T) | { ok: false; error: string; status?: number };

async function call<T = Record<string, unknown>>(path: string, body?: unknown, method: "POST" | "PATCH" | "DELETE" = "POST"): Promise<Res<T>> {
  try {
    const r = await fetch(`/api/admin/${path}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: j.error ?? `HTTP ${r.status}`, status: r.status };
    return { ok: true, ...j };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" };
  }
}

export type SendOutcome = { configured: boolean; sent?: number; failed?: number; skipped?: number; dry_run?: boolean; message?: string; error?: string };

export const adminApi = {
  viewAs: (view: string | null) => call<{ view: string | null }>("view-as", { view }),
  addNote: (userId: string, note: string) => call<{ id: string }>("notes", { userId, note }),
  deleteNote: (id: string) => call("notes", { id }, "DELETE"),
  updateMember: (b: { userId: string; role?: string; ageGroup?: string | null; displayName?: string }) => call("members", b, "PATCH"),
  setFamilyTier: (familyId: string, tier: "fic" | "fta") => call("families/tier", { familyId, tier }),
  invite: (b: { email: string; program: "fic" | "fta"; door: "club" | "family" }) => call<{ mode: string; note?: string }>("invite", b),
  addLead: (b: { email: string; first_name?: string; last_name?: string; phone?: string; tags?: string[]; source?: string; notes?: string }) => call<{ id: string; created: boolean }>("leads", b),
  updateLead: (b: { leadId: string; notes?: string | null; tags?: string[] | null }) => call("leads", b, "PATCH"),
  setStage: (leadId: string, stage: string) => call("leads/stage", { leadId, stage }),
  importLeads: (rows: { email: string; first_name?: string; last_name?: string; phone?: string; tags?: string[] }[], source = "csv") => call<{ imported: number; updated: number; skipped: number }>("leads/import", { rows, source }),
  syncConversions: () => call<{ converted: number; ids: string[] }>("leads/sync"),
  createCampaign: (b: { name: string; channel: "email" | "sms"; body: string; subject?: string; segment?: { stages?: string[]; tags?: string[] } }) => call<{ id: string }>("campaigns", b),
  sendCampaign: (b: { campaignId: string; dryRun: boolean }) => call<SendOutcome>("campaigns/send", b),
  testSend: (b: { channel: "email" | "sms"; to: string; subject?: string; body: string }) => call<SendOutcome>("campaigns/send", { test: b }),
  setDrips: (enabled: boolean) => call("drips", { enabled }),
  supportReply: (ticketId: string, body: string) => call("support", { action: "reply", ticketId, body }),
  supportStatus: (ticketId: string, status: string) => call("support", { action: "set_status", ticketId, status }),
  announce: (b: { title: string; body: string; audience: string; link?: string }) => call<{ recipients: number }>("announce", b),
  push: (b: { title: string; body: string; audience: string; link?: string; test?: boolean }) => call<{ recipients: number; test?: boolean }>("push", b),
  saveCourse: (b: Record<string, unknown> & { id?: string }) => call<{ id: string }>("courses", b, b.id ? "PATCH" : "POST"),
  deleteCourse: (id: string) => call("courses", { id }, "DELETE"),
  saveModule: (b: Record<string, unknown> & { id?: string }) => call<{ id: string }>("courses/modules", b, b.id ? "PATCH" : "POST"),
  deleteModule: (id: string) => call("courses/modules", { id }, "DELETE"),
  saveLesson: (b: Record<string, unknown> & { id?: string }) => call<{ id: string }>("courses/lessons", b, b.id ? "PATCH" : "POST"),
  deleteLesson: (id: string) => call("courses/lessons", { id }, "DELETE"),
  publishDraft: (lessonId: string, action: "publish" | "unpublish") => call("courses/publish", { lessonId, action }),
  saveSession: (b: Record<string, unknown> & { id?: string }) => call<{ id: string }>("live-sessions", b, b.id ? "PATCH" : "POST"),
  deleteSession: (id: string) => call("live-sessions", { id }, "DELETE"),
};
