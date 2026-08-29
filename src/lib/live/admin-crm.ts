import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSession, isAdmin, type Session, type Tier } from "./session";
import { adminClient, must, safe, userClient } from "./supa";
import { parseViewAs, VIEW_AS_COOKIE, type ViewAs } from "@/components/admin/view-as";

/**
 * Admin & CRM readers (Phase 7). Every FTA `admin_*` RPC is SECURITY DEFINER and checks
 * `profiles.role = 'admin'` on auth.uid() itself, so reads go through the cookie session
 * (`userClient`). The service role (`adminClient`) is used ONLY for cross-tenant aggregates
 * that have no RPC (families directory, drips join) and for writes FTA also did with the
 * service role (help-desk replies, membership provisioning) — always behind `adminSession()`.
 */

/* ── gate ─────────────────────────────────────────────────────────────────── */

/** The session, or null unless the caller's real profile is an admin. */
export async function adminSession(): Promise<Session | null> {
  const s = await getSession();
  return s && isAdmin(s) ? s : null;
}

type Fail = { error: NextResponse; session?: undefined; supa?: undefined; admin?: undefined };
type Ok = { error?: undefined; session: Session; supa: SupabaseClient; admin: SupabaseClient | null };
/** Route-handler gate: 401 signed out, 403 non-admin. `admin` is the service client (null when the key is absent). */
export async function requireAdmin(): Promise<Fail | Ok> {
  const s = await getSession();
  if (!s) return { error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  if (!isAdmin(s)) return { error: NextResponse.json({ error: "Admins only" }, { status: 403 }) };
  return { session: s, supa: await userClient(), admin: adminClient() };
}

/** View-as gate (FTA `src/lib/server/view-as.ts`): the cookie is read only after the REAL profile is an admin. */
export async function resolveViewAs(s: Session | null): Promise<ViewAs | null> {
  if (!isAdmin(s)) return null;
  const jar = await cookies();
  return parseViewAs(jar.get(VIEW_AS_COOKIE)?.value);
}

async function rpc<T>(label: string, fn: string, args?: Record<string, unknown>): Promise<T | null> {
  return safe(`admin-crm.${label}`, async () => {
    if (!(await adminSession())) return null;
    const supa = await userClient();
    return must(await supa.rpc(fn, args)) as T;
  });
}

/* ── types (ported from FTA src/lib/{crm,contacts,marketing,funnel-admin,help/admin}.ts) ── */

export type OverviewMember = { id: string; display_name: string | null; avatar_url: string | null; role: string; family_name: string | null; tier?: Tier; joined_at?: string; last_seen?: string | null };
export type ActiveFamily = { family_id: string; name: string | null; tier: Tier; active_members: number; events_7d: number };
export type CrmOverview = {
  total_members: number; total_families: number; tier_fic: number; tier_fta: number; members_fic: number; members_fta: number;
  dau: number; wau: number; mau: number; newest_signups: OverviewMember[]; active_families: ActiveFamily[]; at_risk: OverviewMember[];
};
export type DailyPoint = { day: string; active_users: number; signups: number; posts: number; lessons_completed: number };
export type MemberRow = {
  id: string; display_name: string | null; email: string | null; avatar_url: string | null; role: string; age_group: string | null; track: string | null;
  family_id: string | null; family_name: string | null; tier: Tier; club_until: string | null; club_lapsed: boolean; onboarding_complete: boolean; joined_at: string;
  xp_total: number; lessons_completed: number; quizzes_taken: number; quizzes_passed: number; posts: number; comments: number; missions: number;
  watchlist_adds: number; rsvps: number; badges: number; chat_messages: number; last_seen: string | null;
};
export type TimelineEvent = { type: string; ts: string; title: string; meta: string | null };
export type ContactKind = "lead" | "free" | "fic" | "fta";
export type ContactRow = { contact_id: string; record: "member" | "lead"; name: string | null; email: string | null; phone: string | null; contact_kind: ContactKind; role: string | null; stage: string | null; last_activity: string | null; created: string };
export type SupportTicketSummary = { id: string; subject: string; category: string; status: TicketStatus; priority: string; created_at: string; last_message_at: string; message_count: number; last_message: string | null; last_sender: "user" | "team" | "ai" | null };
export type AdminNote = { id: string; note: string; created_at: string; author_id: string | null; author: { display_name: string | null } | null };
export type FamilyDetail = {
  family: { id: string; name: string | null; plan_tier: string | null; tier: Tier; created_at: string; enrolled_at: string | null; expires_at: string | null; has_stripe: boolean } | null;
  enrollments: { program: string; status: string; started_at: string | null; cohort: string | null }[];
  members: { id: string; display_name: string | null; avatar_url: string | null; role: string; age_group: string | null; email: string | null; xp_total: number; last_seen: string | null }[];
  orientation: { step_key: string; completed_at: string | null }[];
  watchlist: { ticker: string; company_name: string | null; status: string | null; champion: string | null }[];
  combined: { xp_total: number; lessons: number; quizzes: number; posts: number; missions: number; rsvps: number; watchlist_size: number };
};
export type FamilyListRow = { id: string; name: string | null; plan_tier: string | null; door: string | null; tier: Tier; club_lapsed: boolean; members: number; kids: number; created_at: string; expires_at: string | null; has_stripe: boolean };

export const STAGES = ["new", "contacted", "engaged", "nurture", "converted", "cold", "unsubscribed"] as const;
export type Stage = (typeof STAGES)[number];
export const PIPELINE_STAGES: Stage[] = ["new", "contacted", "engaged", "nurture", "converted", "cold"];
export type Lead = {
  id: string; email: string; phone: string | null; first_name: string | null; last_name: string | null; source: string; stage: Stage; tags: string[]; notes: string | null;
  consent_source: string | null; converted_profile_id: string | null; last_activity_at: string; created_at: string; event_count: number; last_event_at: string | null; last_event_type: string | null; is_cold: boolean;
};
export type LeadEvent = { id: string; type: string; meta: Record<string, unknown>; created_at: string };
export type LeadDetail = { lead: (Lead & { custom: Record<string, unknown>; updated_at: string }) | null; events: LeadEvent[] };
export type Campaign = {
  id: string; name: string; channel: "email" | "sms"; subject: string | null; body: string; segment: { stages?: string[]; tags?: string[] }; status: "draft" | "sending" | "sent" | "failed";
  sent_at: string | null; stats: Record<string, unknown>; created_at: string; sends_total: number; sends_sent: number; sends_failed: number; sends_skipped: number;
};
export type DripRow = { id: string; user_id: string; sequence: string | null; step: number; variant: string; status: string; scheduled_at: string; sent_at: string | null; resend_id: string | null; error: string | null; profiles: { display_name: string | null; email: string | null } | null };
export type FunnelAnalytics = {
  steps: { step: string; ord: number; sessions: number }[];
  sources: { source: string; sessions: number; email_captured: number; registered: number }[];
  totals: { sessions: number; engaged: number; email_captured: number; registered: number };
};
export type PartialLead = { id: string; email: string; phone: string | null; sms_optin: boolean; status: string; answers: Record<string, string>; utm_source: string; utm_campaign: string | null; created_at: string; updated_at: string };
export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export const TICKET_CATEGORIES = ["billing", "account", "classes", "technical", "other"] as const;
export type AdminTicketRow = {
  id: string; subject: string; category: string; status: TicketStatus; priority: string; created_at: string; updated_at: string; last_message_at: string; user_id: string;
  display_name: string | null; email: string | null; avatar_url: string | null; role: string; family_id: string | null; family_name: string | null; message_count: number; last_sender: "user" | "team" | "ai" | null; awaiting_team: boolean;
};
export type HelpMessage = { id: string; sender: "user" | "team" | "ai"; body: string; created_at: string };
export type AdminTicketDetail = { ticket: Omit<AdminTicketRow, "message_count" | "last_sender" | "awaiting_team"> | null; messages: HelpMessage[] };
export type CohortMember = { email: string | null; first_name: string | null; phone: string | null; created_at: string; user_id: string | null; onboarding_complete: boolean | null; tier: string | null; expires_at: string | null; src: string | null; xp: number; alert_rules: number; posts: number };
export type CohortData = {
  total: number; activated: number; engaged: number; converted_paid: number; pass_active: number; downgraded_free: number;
  signups_by_day: { day: string; signups: number }[]; signups_by_source?: { source: string; signups: number }[];
  sequences?: { step: string; sent: number; pending: number; other: number; first_scheduled: string }[]; members: CohortMember[];
};
export type AnnouncementRow = { id: string; title: string | null; body: string | null; link: string | null; audience: string | null; author_name: string | null; created_at: string; delivered: number; read_count: number; dispatched: number };
export type BroadcastRow = { id: string; title: string; body: string | null; link: string | null; audience: string; recipients: number; author_name: string | null; created_at: string; read_count: number; dispatched: number };
export type AudienceCount = { recipients: number | null; push_subs: number | null };
export type CourseRow = { id: string; slug: string; title: string; description: string | null; thumbnail_url: string | null; min_tier: string | null; program: string | null; sort_order: number; published: boolean; created_at: string; module_count: number; lesson_count: number };
export type LessonRow = { id: string; module_id: string; title: string; description: string | null; video_provider: string | null; video_id: string | null; video_duration_sec: number | null; drip_week: number | null; has_quiz: boolean; is_free: boolean; sort_order: number; est_minutes: number | null; lesson_xp: number | null; node_kind: string | null; retired: boolean; has_steps: boolean; has_draft: boolean };
export type ModuleRow = { id: string; course_id: string; title: string; description: string | null; track: string | null; sort_order: number; lessons: LessonRow[] };
export type CourseDetail = { course: Omit<CourseRow, "module_count" | "lesson_count">; modules: ModuleRow[] };
export type DraftRow = { course_slug: string; course_title: string; module_id: string; module_title: string; module_track: string | null; module_sort: number; lesson_id: string; lesson_title: string; lesson_sort: number; has_draft: boolean; is_published: boolean; in_sync: boolean };
export type SessionRow = {
  id: string; title: string; description: string | null; scheduled_at: string | null; duration_min: number | null; zoom_join_url: string | null; recording_url: string | null; recording_path: string | null; recording_kind: string | null;
  status: string; track: string | null; min_tier: string | null; class_type: string | null; worksheet_url: string | null; assignment: string | null; host_name: string | null; rsvps: number;
};

/* ── overview ─────────────────────────────────────────────────────────────── */

export const crmOverview = () => rpc<CrmOverview>("overview", "admin_crm_overview");
export const dailyActivity = (days = 30) => rpc<DailyPoint[]>("daily", "admin_daily_activity", { p_days: days });

/** Catalogue counts for the dashboard tiles (admin RLS on courses/lessons/live_sessions). */
export async function catalogueCounts(): Promise<{ courses: number; lessons: number; liveSessions: number; openTickets: number } | null> {
  return safe("admin-crm.catalogue", async () => {
    if (!(await adminSession())) return null;
    const supa = await userClient();
    const [c, l, s, t] = await Promise.all([
      supa.from("courses").select("id", { count: "exact", head: true }),
      supa.from("lessons").select("id", { count: "exact", head: true }).eq("retired", false),
      supa.from("live_sessions").select("id", { count: "exact", head: true }).in("status", ["scheduled", "live"]),
      supa.rpc("admin_help_tickets", { p_status: "open", p_category: "all" }),
    ]);
    return { courses: c.count ?? 0, lessons: l.count ?? 0, liveSessions: s.count ?? 0, openTickets: Array.isArray(t.data) ? t.data.length : 0 };
  });
}

/* ── members / contacts ───────────────────────────────────────────────────── */

export const memberActivity = () => rpc<MemberRow[]>("members", "admin_member_activity");
export const memberTimeline = (userId: string, limit = 40) => rpc<TimelineEvent[]>("timeline", "admin_member_timeline", { p_user_id: userId, p_limit: limit });
export const contacts = (o: { search?: string | null; kind?: ContactKind | "all"; sort?: "recent" | "name" | "created"; limit?: number; offset?: number } = {}) =>
  rpc<ContactRow[]>("contacts", "admin_contacts", { p_search: o.search ?? null, p_kind: o.kind ?? "all", p_sort: o.sort ?? "recent", p_limit: o.limit ?? 2000, p_offset: o.offset ?? 0 });
export const contactSupport = (userId?: string | null, email?: string | null) => rpc<SupportTicketSummary[]>("contactSupport", "admin_contact_support", { p_user_id: userId ?? null, p_email: email ?? null });
export const contactTimeline = (userId?: string | null, email?: string | null, limit = 80) => rpc<TimelineEvent[]>("contactTimeline", "admin_contact_timeline", { p_user_id: userId ?? null, p_email: email ?? null, p_limit: limit });

export async function memberById(userId: string): Promise<MemberRow | null> {
  const rows = await memberActivity();
  return rows?.find((m) => m.id === userId) ?? null;
}

export async function adminNotes(userId: string): Promise<AdminNote[] | null> {
  return safe("admin-crm.notes", async () => {
    if (!(await adminSession())) return null;
    const supa = await userClient();
    const rows = must(await supa.from("admin_notes").select("id, note, created_at, author_id, author:author_id(display_name)").eq("user_id", userId).order("created_at", { ascending: false })) as unknown as (Omit<AdminNote, "author"> & { author: AdminNote["author"] | AdminNote["author"][] })[];
    return rows.map((n) => ({ ...n, author: Array.isArray(n.author) ? n.author[0] ?? null : n.author }));
  });
}

/* ── families ─────────────────────────────────────────────────────────────── */

export const familyDetail = (familyId: string) => rpc<FamilyDetail>("family", "admin_family_detail", { p_family_id: familyId });

/** Cross-tenant families directory — no FTA RPC exists, so service role behind the admin gate. */
export async function familiesList(): Promise<FamilyListRow[] | null> {
  return safe("admin-crm.families", async () => {
    if (!(await adminSession())) return null;
    const admin = adminClient();
    if (!admin) return null;
    type F = { id: string; name: string | null; plan_tier: string | null; door: string | null; created_at: string; expires_at: string | null; stripe_customer_id: string | null };
    const [fams, tiers, profs] = await Promise.all([
      admin.from("families").select("id, name, plan_tier, door, created_at, expires_at, stripe_customer_id").order("created_at", { ascending: false }),
      admin.from("family_tiers").select("family_id, tier, club_lapsed"),
      admin.from("profiles").select("family_id, role, age_group").not("family_id", "is", null),
    ]);
    const tierBy = new Map((must(tiers) as { family_id: string; tier: Tier; club_lapsed: boolean }[]).map((t) => [t.family_id, t]));
    const count = new Map<string, { members: number; kids: number }>();
    for (const p of must(profs) as { family_id: string; role: string | null; age_group: string | null }[]) {
      const c = count.get(p.family_id) ?? { members: 0, kids: 0 };
      c.members += 1;
      if (p.role === "child" || p.age_group === "kids" || p.age_group === "teens") c.kids += 1;
      count.set(p.family_id, c);
    }
    return (must(fams) as F[]).map((f) => ({
      id: f.id, name: f.name, plan_tier: f.plan_tier, door: f.door, created_at: f.created_at, expires_at: f.expires_at, has_stripe: !!f.stripe_customer_id,
      tier: tierBy.get(f.id)?.tier ?? "free", club_lapsed: tierBy.get(f.id)?.club_lapsed ?? false,
      members: count.get(f.id)?.members ?? 0, kids: count.get(f.id)?.kids ?? 0,
    }));
  });
}

/* ── marketing: leads / pipeline / campaigns / drips ──────────────────────── */

export const marketingLeads = () => rpc<Lead[]>("leads", "admin_marketing_leads");
export const leadDetail = (leadId: string) => rpc<LeadDetail>("leadDetail", "admin_marketing_lead_detail", { p_lead_id: leadId });
export const campaigns = () => rpc<Campaign[]>("campaigns", "admin_marketing_campaigns");
export const segmentLeads = (segment: { stages?: string[]; tags?: string[] }) => rpc<{ id: string; email: string; first_name: string | null; last_name: string | null; phone: string | null; stage: Stage; tags: string[] }[]>("segment", "admin_marketing_segment_leads", { p_segment: segment });

export async function drips(limit = 200): Promise<{ rows: DripRow[]; enabled: boolean } | null> {
  return safe("admin-crm.drips", async () => {
    if (!(await adminSession())) return null;
    const supa = await userClient();
    const [d, flag] = await Promise.all([
      supa.from("email_drips").select("id, user_id, sequence, step, variant, status, scheduled_at, sent_at, resend_id, error, profiles(display_name, email)").order("scheduled_at", { ascending: false }).limit(limit),
      supa.from("app_settings").select("value").eq("key", "drip_enabled").maybeSingle(),
    ]);
    const rows = (must(d) as unknown as (Omit<DripRow, "profiles"> & { profiles: DripRow["profiles"] | DripRow["profiles"][] })[]).map((r) => ({ ...r, profiles: Array.isArray(r.profiles) ? r.profiles[0] ?? null : r.profiles }));
    return { rows, enabled: flag.data?.value === true };
  });
}

/* ── funnel ───────────────────────────────────────────────────────────────── */

export const funnelAnalytics = (fromIso: string, toIso: string, funnel = "free_class") => rpc<FunnelAnalytics>("funnel", "admin_funnel_analytics", { p_funnel: funnel, p_from: fromIso, p_to: toIso });
export const funnelPartialLeads = (fromIso: string, toIso: string, funnel = "free_class") => rpc<PartialLead[]>("funnelPartial", "admin_funnel_partial_leads", { p_funnel: funnel, p_from: fromIso, p_to: toIso });

/* ── support ──────────────────────────────────────────────────────────────── */

export const helpTickets = (status = "all", category = "all") => rpc<AdminTicketRow[]>("tickets", "admin_help_tickets", { p_status: status, p_category: category });
export const helpTicketDetail = (ticketId: string) => rpc<AdminTicketDetail>("ticket", "admin_help_ticket_detail", { p_ticket_id: ticketId });

/* ── challenge cohort ─────────────────────────────────────────────────────── */

export const challengeCohort = () => rpc<CohortData>("cohort", "admin_challenge_cohort");
export const challengeVipStats = () => rpc<Record<string, unknown>>("vip", "admin_challenge_vip_stats");

/* ── announcements + push ─────────────────────────────────────────────────── */

export const announcementHistory = (limit = 50) => rpc<AnnouncementRow[]>("announcements", "admin_announcement_history", { p_limit: limit });
export const broadcastHistory = (limit = 50) => rpc<BroadcastRow[]>("broadcasts", "admin_broadcast_history", { p_limit: limit });
export const audienceCount = (audience: string) => rpc<AudienceCount>("audience", "notif_audience_count", { p_audience: audience });

/* ── courses ──────────────────────────────────────────────────────────────── */

export async function coursesList(): Promise<CourseRow[] | null> {
  return safe("admin-crm.courses", async () => {
    if (!(await adminSession())) return null;
    const supa = await userClient();
    const [c, m, l] = await Promise.all([
      supa.from("courses").select("id, slug, title, description, thumbnail_url, min_tier, program, sort_order, published, created_at").order("sort_order"),
      supa.from("modules").select("id, course_id"),
      supa.from("lessons").select("id, module_id").eq("retired", false),
    ]);
    const mods = must(m) as { id: string; course_id: string }[];
    const lessons = must(l) as { id: string; module_id: string }[];
    const modCourse = new Map(mods.map((x) => [x.id, x.course_id]));
    const mc = new Map<string, number>(), lc = new Map<string, number>();
    for (const x of mods) mc.set(x.course_id, (mc.get(x.course_id) ?? 0) + 1);
    for (const x of lessons) { const cid = modCourse.get(x.module_id); if (cid) lc.set(cid, (lc.get(cid) ?? 0) + 1); }
    return (must(c) as Omit<CourseRow, "module_count" | "lesson_count">[]).map((x) => ({ ...x, module_count: mc.get(x.id) ?? 0, lesson_count: lc.get(x.id) ?? 0 }));
  });
}

export async function courseDetail(courseId: string): Promise<CourseDetail | null> {
  return safe("admin-crm.course", async () => {
    if (!(await adminSession())) return null;
    const supa = await userClient();
    const course = must(await supa.from("courses").select("id, slug, title, description, thumbnail_url, min_tier, program, sort_order, published, created_at").eq("id", courseId).maybeSingle()) as CourseDetail["course"] | null;
    if (!course) return null;
    const mods = must(await supa.from("modules").select("id, course_id, title, description, track, sort_order").eq("course_id", courseId).order("sort_order")) as Omit<ModuleRow, "lessons">[];
    const ids = mods.map((m) => m.id);
    type L = Omit<LessonRow, "has_steps" | "has_draft"> & { steps: unknown; steps_draft: unknown };
    const lessons = ids.length
      ? (must(await supa.from("lessons").select("id, module_id, title, description, video_provider, video_id, video_duration_sec, drip_week, has_quiz, is_free, sort_order, est_minutes, lesson_xp, node_kind, retired, steps, steps_draft").in("module_id", ids).order("sort_order")) as L[])
      : [];
    return {
      course,
      modules: mods.map((m) => ({ ...m, lessons: lessons.filter((l) => l.module_id === m.id).map(({ steps, steps_draft, ...l }) => ({ ...l, has_steps: steps != null, has_draft: steps_draft != null })) })),
    };
  });
}

export const learnDrafts = () => rpc<DraftRow[]>("drafts", "list_learn_drafts");

/* ── live sessions ────────────────────────────────────────────────────────── */

export async function liveSessions(): Promise<SessionRow[] | null> {
  return safe("admin-crm.live", async () => {
    if (!(await adminSession())) return null;
    const supa = await userClient();
    const [s, r] = await Promise.all([
      supa.from("live_sessions").select("id, title, description, scheduled_at, duration_min, zoom_join_url, recording_url, recording_path, recording_kind, status, track, min_tier, class_type, worksheet_url, assignment, host_name").order("scheduled_at", { ascending: false }),
      supa.from("session_rsvps").select("session_id"),
    ]);
    const rs = new Map<string, number>();
    for (const x of (r.data ?? []) as { session_id: string }[]) rs.set(x.session_id, (rs.get(x.session_id) ?? 0) + 1);
    return (must(s) as Omit<SessionRow, "rsvps">[]).map((x) => ({ ...x, rsvps: rs.get(x.id) ?? 0 }));
  });
}

/* ── membership provisioning (port of FTA src/lib/server/membership.ts) ───── */

export type ProvisionMode = "invited" | "invited_via_supabase" | "invited_email_failed" | "activated" | "pending";

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://app.familyinvestingclub.com").replace(/\/$/, "");
const FROM = () => process.env.MARKETING_FROM_EMAIL?.trim() || "Family Investing Club <hello@familyinvestingclub.com>";

/** True when outbound email can actually be sent from this deployment. */
export const resendConfigured = () => !!process.env.RESEND_API_KEY?.trim();
export const twilioConfigured = () => !!(process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim() && process.env.TWILIO_PHONE_NUMBER?.trim());

export async function sendEmail(o: { to: string; subject: string; html: string; text?: string }): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { ok: false, error: "RESEND_API_KEY not configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: FROM(), to: [o.to], subject: o.subject, html: o.html, text: o.text }) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: `${res.status}: ${body?.message || body?.error?.message || "Resend error"}` };
    return { ok: true, id: body?.id };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : "email send failed" }; }
}

export async function sendSms(o: { to: string; body: string }): Promise<{ ok: boolean; id?: string; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim(), token = process.env.TWILIO_AUTH_TOKEN?.trim(), from = process.env.TWILIO_PHONE_NUMBER?.trim();
  if (!sid || !token || !from) return { ok: false, error: "Twilio credentials not configured" };
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ To: o.to, From: from, Body: o.body }) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: `${res.status}: ${body?.message || "Twilio error"}` };
    return { ok: true, id: body?.sid };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : "sms send failed" }; }
}

/** `{{first_name}}` / `{{last_name}}` / `{{email}}` merge fields (FTA renderMerge). */
export function renderMerge(t: string, lead: { first_name?: string | null; last_name?: string | null; email?: string | null }): string {
  return (t || "").replace(/\{\{\s*first_name\s*\}\}/gi, lead.first_name || "there").replace(/\{\{\s*last_name\s*\}\}/gi, lead.last_name || "").replace(/\{\{\s*email\s*\}\}/gi, lead.email || "");
}

function inviteHtml(brand: string, link: string): string {
  return `<!doctype html><html><body style="margin:0;background:#FAF3E5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:16px;border:1px solid #EBDFC7;overflow:hidden;"><tr><td style="height:6px;background:#3A6B3E;"></td></tr><tr><td style="padding:28px 32px 8px;font-size:22px;font-weight:800;color:#2E2A21;">Welcome to ${brand} 🎉</td></tr><tr><td style="padding:8px 32px 0;font-size:16px;color:#6E6654;line-height:1.65;">Your account is ready. Click below to set your password and jump straight in.</td></tr><tr><td align="center" style="padding:24px 32px 8px;"><a href="${link}" style="display:inline-block;padding:15px 30px;font-size:16px;font-weight:700;color:#FFFCF5;text-decoration:none;border-radius:12px;background:#E58234;">Set up my account &rarr;</a></td></tr><tr><td style="padding:8px 32px 28px;font-size:13px;color:#8F8672;line-height:1.6;">If the button doesn't work, copy this link into your browser:<br/><a href="${link}" style="color:#3A6B3E;word-break:break-all;">${link}</a></td></tr></table></td></tr></table></body></html>`;
}

/**
 * Record `pending_memberships` and either invite a brand-new user or activate an existing family.
 * With RESEND_API_KEY: generateLink(invite) + branded email (FTA path). Without it: Supabase's own
 * `inviteUserByEmail` (GoTrue SMTP) so the admin can still onboard someone today.
 */
export async function provisionMembership(o: { email: string; program: "fic" | "fta"; invitedBy: string; door: "club" | "family" }): Promise<{ ok: true; mode: ProvisionMode; note?: string } | { ok: false; error: string }> {
  const db = adminClient();
  if (!db) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY not configured" };
  const email = o.email.trim().toLowerCase();
  const { data: dupe } = await db.from("pending_memberships").select("id").eq("email", email).eq("program", o.program).is("claimed_at", null).limit(1).maybeSingle();
  if (!dupe) {
    const { error } = await db.from("pending_memberships").insert({ email, program: o.program, source: "admin", invited_by: o.invitedBy, club_months: null, door: o.door });
    if (error) return { ok: false, error: error.message };
  }
  const { data: prof } = await db.from("profiles").select("id, family_id").ilike("email", email).limit(1).maybeSingle();
  let userId = prof?.id ?? null;
  if (!userId) {
    const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = list?.users?.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
  }
  if (!userId) {
    const brand = o.program === "fta" ? "Family Trading Academy" : "Family Investing Club";
    if (resendConfigured()) {
      const { data: link, error } = await db.auth.admin.generateLink({ type: "invite", email, options: { redirectTo: `${SITE()}/auth/callback?next=/onboarding/who` } });
      const action = link?.properties?.action_link;
      if (error || !action) return { ok: false, error: error?.message || "invite link generation failed" };
      const sent = await sendEmail({ to: email, subject: `Welcome to ${brand} — set up your account`, html: inviteHtml(brand, action), text: `Welcome to ${brand}!\n\nSet your password and get started:\n${action}` });
      return sent.ok ? { ok: true, mode: "invited" } : { ok: true, mode: "invited_email_failed", note: sent.error };
    }
    const { error } = await db.auth.admin.inviteUserByEmail(email, { redirectTo: `${SITE()}/auth/callback?next=/onboarding/who` });
    if (error) return { ok: false, error: `Supabase invite failed: ${error.message}` };
    return { ok: true, mode: "invited_via_supabase", note: "RESEND_API_KEY not set — Supabase's own invite email was used." };
  }
  const familyId = prof?.family_id ?? (await db.from("profiles").select("family_id").eq("id", userId).maybeSingle()).data?.family_id ?? null;
  if (familyId) {
    const { error } = await db.from("enrollments").upsert({ family_id: familyId, program: o.program, status: "active", club_until: null }, { onConflict: "family_id,program" });
    if (error) return { ok: false, error: error.message };
    await db.from("pending_memberships").update({ claimed_at: new Date().toISOString() }).eq("email", email).is("claimed_at", null);
    return { ok: true, mode: "activated" };
  }
  return { ok: true, mode: "pending" };
}

/* ── formatting helpers shared by the admin pages ─────────────────────────── */

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "—";
  if (ms < 60_000) return "just now";
  const min = Math.floor(ms / 60_000); if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60); if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24); if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30); if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export function dateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
