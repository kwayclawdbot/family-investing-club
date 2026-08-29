import "server-only";
import { cache } from "react";
import type { Badge, ExplanationLevel, Family, FamilyLearner } from "@/lib/types";
import { getSession, isChild, isParent, levelOf, type ProfileRow, type Session } from "./session";
import { ago, colorFor, firstName, initialOf, must, safe, userClient } from "./supa";

/**
 * FAMILY — the household on FTA's real tables (Backend Cutover Plan, Phase 4).
 *
 *   families · profiles (kids = role 'child', age_group kids|teens) · family_invites ·
 *   family_guardrails (+ set_family_guardrail, family_guardrail_events) · family_activity_days ·
 *   family_watchlist (+ family_watchlist_votes) · family_night_sessions · report_notes ·
 *   child_report_stats(p_child) · lesson_progress · xp_events · badge_awards · fic_missions.
 *
 * Every reader runs as the member (RLS). `null` means the domain is genuinely empty or the viewer
 * has no household — screens render an EmptyState, never a fixture.
 */

/* ── rows ─────────────────────────────────────────────────────────── */
type MemberProfile = Pick<ProfileRow, "id" | "display_name" | "email" | "role" | "age_group" | "comprehension_level" | "username" | "avatar_url"> & { created_at?: string | null };
type XpRow = { user_id: string; amount: number; kind: string | null; ref_id: string | null; created_at: string };
type InviteRow = { id: string; code: string; role: string | null; age_group: string | null; email: string | null; used_by: string | null; expires_at: string; created_at: string };
type WatchRow = { id: string; ticker: string; company_name: string | null; status: string | null; champion_id: string | null; why_we_picked: string | null; how_they_make_money: string | null; what_they_sell: string | null; strength: string | null; risk: string | null; updated_at: string; wl_active: boolean | null };
type VoteRow = { id: string; user_id: string; ticker: string; company_name: string | null; vote_night: string };
type NightRow = { id: string; night: string; ticker: string | null; company_name: string | null; host_id: string | null; attendee_ids: string[] | null };
type MissionRow = { id: string; slug: string; title: string; description: string | null; kid_prompt: string | null; xp_reward: number | null; sort: number | null };
type CompletionRow = { mission_id: string; user_id: string; completed_at: string };

/* ── public types ──────────────────────────────────────────────────── */
export type HouseholdRole = "parent" | "child" | "admin" | "coach";
export type HouseholdMember = {
  id: string; name: string; fullName: string; username: string | null; avatarUrl: string | null;
  role: HouseholdRole; ageGroup: "kids" | "teens" | "adults" | null; isKid: boolean; isYou: boolean;
  level: ExplanationLevel; color: string; initial: string;
  lifetimeXp: number; weekXp: number; activeDaysThisWeek: number; lastActiveAt: string | null; lastActive: string;
  /** Server-computed so pages stay pure (React Compiler): seen within the last 24h. */
  activeToday: boolean;
};
export type Household = {
  id: string; name: string; door: string | null; tier: string | null;
  me: string; isParent: boolean; isKid: boolean;
  members: HouseholdMember[]; kids: HouseholdMember[];
  weekXp: number; lifetimeXp: number;
};
export type FamilyInvite = { id: string; code: string; role: "parent" | "child"; ageGroup: "kids" | "teens" | null; email: string | null; used: boolean; expired: boolean; expiresAt: string; createdAt: string };

export type Guardrails = {
  child_id: string; family_id: string; chat_family_only: boolean; downtime_enabled: boolean; downtime_start_hour: number; downtime_end_hour: number;
  daily_limit_min: number | null; live_listen_only: boolean; tz: string; updated_at: string | null; updated_by: string | null;
};
export const DEFAULT_GUARDRAILS = { chat_family_only: true, downtime_enabled: false, downtime_start_hour: 21, downtime_end_hour: 7, daily_limit_min: null as number | null, live_listen_only: true, tz: "America/New_York" };
export type GuardrailEvent = { id: string; setting: string; oldValue: unknown; newValue: unknown; at: string; ago: string; actor: string };
export type ActivityDay = { day: string; minutes: number };

export type ReportCard = {
  source: "rpc" | "computed";
  lessonsDone: number; lessonsTotal: number; behind: number | null; cohortWeek: number | null;
  quizCount: number; quizAvg: number | null; quizLow: number;
  practiceCount: number; gameCount: number; gameBest: number; lastPracticeAt: string | null;
  /** Server-computed: no practice or games in the last 7 days. */
  practiceStale: boolean;
  xp: number; badges: number;
};
export type LearnerLesson = { id: string; title: string; status: string; pct: number; at: string; ago: string };
export type LearnerReport = {
  member: HouseholdMember; household: Household;
  report: ReportCard;
  lessons: { completed: number; total: number; minutes: number; recent: LearnerLesson[] };
  recentXp: { id: string; label: string; xp: number; ago: string }[];
  badges: { id: string; title: string; emoji: string; awardedAt: string }[];
  guardrails: Guardrails | null; guardrailEvents: GuardrailEvent[]; activity: ActivityDay[]; activityMinutesWeek: number;
  /** Exactly 7 entries, oldest → today, zero-filled. Built server-side so the chart renders purely. */
  activityWeek: ActivityDay[];
  paper: { balance: number; startingBalance: number; returnPct: number | null; positions: number } | null;
  note: { week: number; note: string; at: string } | null; noteWeek: number;
};

export type WatchlistEntry = { id: string; ticker: string; name: string; status: string; championId: string | null; champion: string; why: string; howTheyMakeMoney: string | null; whatTheySell: string | null; strength: string | null; risk: string | null; updatedAgo: string; votes: number; voters: string[] };
export type FamilyWatchlist = { night: string; entries: WatchlistEntry[]; myVote: string | null; leader: WatchlistEntry | null; canVote: boolean };

export type NightState = {
  night: string; label: string; isParent: boolean;
  leader: WatchlistEntry | null; options: WatchlistEntry[]; myVote: string | null;
  questions: string[]; members: HouseholdMember[]; alreadyPaid: string[]; xpPerAttendee: number;
  history: { night: string; ticker: string | null; name: string | null; host: string; attendees: number }[];
};
export const FAMILY_NIGHT_XP = 20;
export const VOTE_XP = 10;
export const nightRef = (night: string) => `family_night:${night}`;
export const voteRef = (night: string) => `family_vote:${night}`;

export type Mission = { id: string; slug: string; title: string; description: string; kidPrompt: string | null; xp: number; completedBy: string[]; doneByMe: boolean };

export type ProfileSettings = {
  id: string; email: string; displayName: string; username: string; avatarUrl: string | null; role: string | null; ageGroup: string | null;
  comprehensionLevel: "beginner" | "developing" | "proficient" | null; notificationPrefs: Record<string, unknown>; familyName: string | null; isKid: boolean;
};
export type MyBadges = { earned: (Badge & { title: string; how: string; awardedAt: string })[]; locked: (Badge & { how: string })[] };
export type MyProgress = {
  week: { d: string; xp: number }[]; weekXp: number; bestDay: string | null; recent: { id: string; title: string; sub: string; xp: number }[];
  lessons: { completed: number; total: number }; streakDays: number; mastery: { path: string; pct: number }[];
};

/* ── helpers ───────────────────────────────────────────────────────── */
const WEEK_MS = 7 * 86400000;
function isKidProfile(p: Pick<ProfileRow, "role" | "age_group">): boolean {
  const a = (p.age_group ?? "").toLowerCase();
  return p.role === "child" || a === "kids" || a === "teens";
}
export function yearWeek(d = new Date()): number {
  // ISO week number, prefixed by the year so report notes never collide across years.
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const week = Math.ceil((((t.getTime() - Date.UTC(y, 0, 1)) / 86400000) + 1) / 7);
  return y * 100 + week;
}
export function todayIso(): string { return new Date().toISOString().slice(0, 10); }
function lastActiveLabel(iso: string | null): string {
  if (!iso) return "Not active yet";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? "Today" : d === 1 ? "Yesterday" : `${d} days ago`;
}
const BADGE_EMOJI: Record<string, string> = { first: "🌱", lesson: "📚", trade: "📈", quiz: "⭐", divers: "🧺", streak: "🔥", research: "🔍", family: "👨‍👩‍👧‍👦", chart: "📊", debate: "💬", night: "🌙", mission: "🎯" };
function badgeEmoji(slug: string | null | undefined): string {
  const s = (slug ?? "").toLowerCase();
  return Object.entries(BADGE_EMOJI).find(([k]) => s.includes(k))?.[1] ?? "🏅";
}
const XP_LABEL: Record<string, string> = { lesson: "Lesson", quiz: "Quiz", flashcards: "Flashcards", game: "Game", community: "Community", rsvp: "RSVP", bonus: "Bonus" };
function xpLabel(kind: string | null, ref: string | null): string {
  const base = XP_LABEL[(kind ?? "").toLowerCase()] ?? "Activity";
  if (ref?.startsWith("family_night:")) return "Family Investing Night";
  if (ref?.startsWith("family_vote:")) return "Family watchlist vote";
  if (ref?.startsWith("mission:")) return `Mission: ${ref.slice(8).replace(/[-_]/g, " ")}`;
  return base;
}

/** No practice/game in the last 7 days. Computed server-side so pages stay render-pure. */
function isStale(iso: string | null): boolean {
  return !iso || Date.now() - new Date(iso).getTime() > 7 * 86400000;
}

/** Zero-filled last 7 days (oldest → today) for the activity chart. */
function weekOf(rows: ActivityDay[]): ActivityDay[] {
  const now = Date.now();
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now - (6 - i) * 86400000).toISOString().slice(0, 10);
    return { day, minutes: rows.find((a) => a.day === day)?.minutes ?? 0 };
  });
}

/* ── the household (memoised per request) ─────────────────────────── */
export const householdContext = cache(async (): Promise<{ session: Session; household: Household; profiles: Map<string, MemberProfile> } | null> => {
  const s = await getSession();
  if (!s?.profile?.family_id || !s.family) return null;
  const famId = s.profile.family_id;
  return safe("family.household", async () => {
    const nowMs = Date.now();
    const weekAgo = new Date(nowMs - WEEK_MS).toISOString();
    const supa = await userClient();
    const rows = must(await supa.from("profiles").select("id, display_name, email, role, age_group, comprehension_level, username, avatar_url, created_at").eq("family_id", famId).order("created_at")) as MemberProfile[];
    if (!rows.length) return null;
    const ids = rows.map((r) => r.id);
    const [xpTotals, weekRows, lastRows] = await Promise.all([
      supa.rpc("xp_for_users", { p_user_ids: ids }),
      supa.from("xp_events").select("user_id, amount, created_at").in("user_id", ids).gte("created_at", weekAgo),
      supa.from("xp_events").select("user_id, created_at").in("user_id", ids).order("created_at", { ascending: false }).limit(200),
    ]);
    const lifetime = new Map<string, number>();
    for (const r of ((xpTotals.data ?? []) as { user_id: string; xp: number | string }[])) lifetime.set(r.user_id, Number(r.xp) || 0);
    const week = new Map<string, number>(), days = new Map<string, Set<string>>(), last = new Map<string, string>();
    for (const r of ((weekRows.data ?? []) as XpRow[])) {
      week.set(r.user_id, (week.get(r.user_id) ?? 0) + (r.amount ?? 0));
      days.set(r.user_id, (days.get(r.user_id) ?? new Set()).add(r.created_at.slice(0, 10)));
    }
    for (const r of ((lastRows.data ?? []) as { user_id: string; created_at: string }[])) if (!last.has(r.user_id)) last.set(r.user_id, r.created_at);

    const members: HouseholdMember[] = rows.map((p) => {
      const name = firstName(p.display_name, p.email);
      const role = (["parent", "child", "admin", "coach"].includes(p.role ?? "") ? p.role : "parent") as HouseholdRole;
      const lastAt = last.get(p.id) ?? null;
      return {
        id: p.id, name, fullName: (p.display_name ?? "").trim() || name, username: p.username ?? null, avatarUrl: p.avatar_url ?? null,
        role, ageGroup: (p.age_group as HouseholdMember["ageGroup"]) ?? null, isKid: isKidProfile(p), isYou: p.id === s.user.id,
        level: levelOf(p), color: colorFor(p.id), initial: initialOf(name),
        lifetimeXp: lifetime.get(p.id) ?? 0, weekXp: week.get(p.id) ?? 0, activeDaysThisWeek: days.get(p.id)?.size ?? 0, lastActiveAt: lastAt, lastActive: lastActiveLabel(lastAt),
        activeToday: !!lastAt && nowMs - new Date(lastAt).getTime() < 86400000,
      };
    }).sort((a, b) => (a.isKid === b.isKid ? b.weekXp - a.weekXp : a.isKid ? 1 : -1));

    const household: Household = {
      id: famId, name: s.family!.name?.trim() || "Our Family", door: s.family!.door, tier: s.tier,
      me: s.user.id, isParent: isParent(s), isKid: isChild(s),
      members, kids: members.filter((m) => m.isKid),
      weekXp: members.reduce((a, m) => a + m.weekXp, 0), lifetimeXp: members.reduce((a, m) => a + m.lifetimeXp, 0),
    };
    return { session: s, household, profiles: new Map(rows.map((r) => [r.id, r])) };
  });
});

export async function getHousehold(): Promise<Household | null> {
  return (await householdContext())?.household ?? null;
}

/* ── invites (parents) ─────────────────────────────────────────────── */
export async function getFamilyInvites(): Promise<FamilyInvite[] | null> {
  const ctx = await householdContext();
  if (!ctx || !ctx.household.isParent) return null;
  return safe("family.invites", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("family_invites").select("id, code, role, age_group, email, used_by, expires_at, created_at").eq("family_id", ctx.household.id).order("created_at", { ascending: false }).limit(30)) as InviteRow[];
    return rows.map((i) => ({
      id: i.id, code: i.code, role: i.role === "parent" ? "parent" : "child", ageGroup: i.age_group === "kids" || i.age_group === "teens" ? i.age_group : null,
      email: i.email, used: !!i.used_by, expired: new Date(i.expires_at) < new Date(), expiresAt: i.expires_at, createdAt: i.created_at,
    }));
  });
}

/* ── guardrails ────────────────────────────────────────────────────── */
export async function getGuardrails(childId: string): Promise<Guardrails | null> {
  const ctx = await householdContext();
  if (!ctx) return null;
  return safe("family.guardrails", async () => {
    const supa = await userClient();
    const row = must(await supa.from("family_guardrails").select("*").eq("child_id", childId).maybeSingle()) as Guardrails | null;
    return row ?? { child_id: childId, family_id: ctx.household.id, updated_at: null, updated_by: null, ...DEFAULT_GUARDRAILS };
  });
}
export async function getGuardrailsForKids(): Promise<Map<string, Guardrails>> {
  const out = new Map<string, Guardrails>();
  const ctx = await householdContext();
  if (!ctx || !ctx.household.kids.length) return out;
  const ids = ctx.household.kids.map((k) => k.id);
  const rows = await safe("family.guardrails.batch", async () => {
    const supa = await userClient();
    return must(await supa.from("family_guardrails").select("*").in("child_id", ids)) as Guardrails[];
  });
  const byChild = new Map((rows ?? []).map((r) => [r.child_id, r]));
  for (const id of ids) out.set(id, byChild.get(id) ?? { child_id: id, family_id: ctx.household.id, updated_at: null, updated_by: null, ...DEFAULT_GUARDRAILS });
  return out;
}
export function guardrailSummary(g: Guardrails): string[] {
  const hour = (h: number) => { const x = ((h % 24) + 24) % 24; return `${x % 12 === 0 ? 12 : x % 12} ${x < 12 ? "AM" : "PM"}`; };
  const out = ["Practice money only", g.chat_family_only ? "Family chat only" : "Chat not limited to family", g.downtime_enabled ? `Downtime ${hour(g.downtime_start_hour)} – ${hour(g.downtime_end_hour)}` : "No downtime set"];
  if (g.daily_limit_min != null) out.push(`${g.daily_limit_min} min a day`);
  return out;
}

/* ── parent view per learner ───────────────────────────────────────── */
type RpcReport = { error?: string; foundations_total?: number; foundations_done?: number; behind_count?: number; cohort_week?: number | null; quiz_count?: number; quiz_avg?: number | null; quiz_low?: number; practice_count?: number; game_count?: number; game_best?: number; last_practice_at?: string | null; xp?: number; badges_count?: number };

async function computeReport(childId: string, lessonsTotal: number, lessonsDone: number, xp: number, badges: number): Promise<ReportCard> {
  const supa = await userClient();
  const [quiz, games] = await Promise.all([
    supa.from("quiz_attempts").select("quiz_id, score, created_at").eq("user_id", childId).order("created_at", { ascending: false }).limit(200),
    supa.from("game_scores").select("score, created_at").eq("user_id", childId).order("created_at", { ascending: false }).limit(100),
  ]);
  const latest = new Map<string, number>();
  for (const q of ((quiz.data ?? []) as { quiz_id: string; score: number }[])) if (!latest.has(q.quiz_id)) latest.set(q.quiz_id, q.score);
  const scores = [...latest.values()];
  const g = (games.data ?? []) as { score: number; created_at: string }[];
  return {
    source: "computed", lessonsDone, lessonsTotal, behind: null, cohortWeek: null,
    quizCount: scores.length, quizAvg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null, quizLow: scores.filter((s) => s < 70).length,
    practiceCount: 0, gameCount: g.length, gameBest: g.length ? Math.max(...g.map((x) => x.score ?? 0)) : 0, lastPracticeAt: g[0]?.created_at ?? null,
    practiceStale: isStale(g[0]?.created_at ?? null),
    xp, badges,
  };
}

export async function getLearnerReport(memberId: string): Promise<LearnerReport | null> {
  const ctx = await householdContext();
  if (!ctx || !ctx.household.isParent) return null;
  const member = ctx.household.members.find((m) => m.id === memberId);
  if (!member) return null;
  return safe("family.learnerReport", async () => {
    const supa = await userClient();
    const sevenDays = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    const noteWeek = yearWeek();
    const [rpc, progress, totals, xp, awards, guard, events, activity, paper, note] = await Promise.all([
      member.isKid ? supa.rpc("child_report_stats", { p_child: memberId }) : Promise.resolve({ data: null, error: null }),
      supa.from("lesson_progress").select("lesson_id, status, progress_pct, time_spent_sec, updated_at, lessons(title)").eq("user_id", memberId).order("updated_at", { ascending: false }).limit(300),
      supa.from("lessons").select("id, retired, modules!inner(courses!inner(published))").eq("modules.courses.published", true).limit(500),
      supa.from("xp_events").select("id, user_id, amount, kind, ref_id, created_at").eq("user_id", memberId).order("created_at", { ascending: false }).limit(10),
      supa.from("badge_awards").select("id, awarded_at, badges(slug, title)").eq("user_id", memberId).order("awarded_at", { ascending: false }).limit(12),
      member.isKid ? supa.from("family_guardrails").select("*").eq("child_id", memberId).maybeSingle() : Promise.resolve({ data: null, error: null }),
      member.isKid ? supa.from("family_guardrail_events").select("id, setting, old_value, new_value, created_at, actor_id").eq("child_id", memberId).order("created_at", { ascending: false }).limit(6) : Promise.resolve({ data: [], error: null }),
      member.isKid ? supa.from("family_activity_days").select("day, minutes").eq("child_id", memberId).gte("day", sevenDays).order("day") : Promise.resolve({ data: [], error: null }),
      member.isKid ? supa.rpc("family_paper_account", { p_child: memberId }) : Promise.resolve({ data: null, error: null }),
      supa.from("report_notes").select("week, note, created_at").eq("child_id", memberId).order("week", { ascending: false }).limit(1).maybeSingle(),
    ]);

    type ProgRow = { lesson_id: string; status: string | null; progress_pct: number | null; time_spent_sec: number | null; updated_at: string; lessons: { title: string } | null };
    const prog = (progress.data ?? []) as unknown as ProgRow[];
    const liveLessons = ((totals.data ?? []) as { id: string; retired: boolean | null }[]).filter((l) => !l.retired);
    const completed = prog.filter((p) => p.status === "completed").length;
    const minutes = Math.round(prog.reduce((a, p) => a + (p.time_spent_sec ?? 0), 0) / 60);
    const badgeRows = ((awards.data ?? []) as unknown as { id: string; awarded_at: string; badges: { slug: string | null; title: string | null } | null }[]);
    const badges = badgeRows.map((b) => ({ id: b.id, title: b.badges?.title ?? "Badge", emoji: badgeEmoji(b.badges?.slug), awardedAt: b.awarded_at }));

    const r = (rpc.data ?? null) as RpcReport | null;
    const report: ReportCard = r && !r.error
      ? { source: "rpc", lessonsDone: r.foundations_done ?? completed, lessonsTotal: r.foundations_total ?? liveLessons.length, behind: r.behind_count ?? null, cohortWeek: r.cohort_week ?? null, quizCount: r.quiz_count ?? 0, quizAvg: r.quiz_avg ?? null, quizLow: r.quiz_low ?? 0, practiceCount: r.practice_count ?? 0, gameCount: r.game_count ?? 0, gameBest: r.game_best ?? 0, lastPracticeAt: r.last_practice_at ?? null, practiceStale: isStale(r.last_practice_at ?? null), xp: r.xp ?? member.lifetimeXp, badges: r.badges_count ?? badges.length }
      : await computeReport(memberId, liveLessons.length, completed, member.lifetimeXp, badges.length);

    const actorIds = [...new Set(((events.data ?? []) as { actor_id: string | null }[]).map((e) => e.actor_id).filter(Boolean))] as string[];
    const actorName = (id: string | null) => (id ? firstName(ctx.profiles.get(id)?.display_name, ctx.profiles.get(id)?.email) : "A parent");
    void actorIds;
    const p = (paper.data ?? null) as { portfolio: { balance: number; starting_balance: number } | null; positions: unknown[] } | null;
    const act = ((activity.data ?? []) as ActivityDay[]);
    const n = (note.data ?? null) as { week: number; note: string; created_at: string } | null;

    return {
      member, household: ctx.household, report,
      lessons: { completed, total: liveLessons.length, minutes, recent: prog.slice(0, 6).map((x) => ({ id: x.lesson_id, title: x.lessons?.title ?? "Lesson", status: x.status ?? "in_progress", pct: x.progress_pct ?? 0, at: x.updated_at, ago: ago(x.updated_at) })) },
      recentXp: ((xp.data ?? []) as (XpRow & { id: string })[]).map((e) => ({ id: e.id, label: xpLabel(e.kind, e.ref_id), xp: e.amount, ago: ago(e.created_at) })),
      badges,
      guardrails: member.isKid ? ((guard.data as Guardrails | null) ?? { child_id: memberId, family_id: ctx.household.id, updated_at: null, updated_by: null, ...DEFAULT_GUARDRAILS }) : null,
      guardrailEvents: ((events.data ?? []) as { id: string; setting: string; old_value: unknown; new_value: unknown; created_at: string; actor_id: string | null }[]).map((e) => ({ id: e.id, setting: e.setting, oldValue: e.old_value, newValue: e.new_value, at: e.created_at, ago: ago(e.created_at), actor: actorName(e.actor_id) })),
      activity: act, activityMinutesWeek: act.reduce((a, d) => a + (d.minutes ?? 0), 0), activityWeek: weekOf(act),
      paper: p?.portfolio ? { balance: Number(p.portfolio.balance), startingBalance: Number(p.portfolio.starting_balance), returnPct: p.portfolio.starting_balance ? Math.round(((Number(p.portfolio.balance) - Number(p.portfolio.starting_balance)) / Number(p.portfolio.starting_balance)) * 1000) / 10 : null, positions: (p.positions ?? []).length } : null,
      note: n ? { week: n.week, note: n.note, at: n.created_at } : null, noteWeek,
    };
  });
}

/* ── family watchlist + votes ──────────────────────────────────────── */
async function loadWatchlist(ctx: NonNullable<Awaited<ReturnType<typeof householdContext>>>, night: string) {
  const supa = await userClient();
  const [wl, votes] = await Promise.all([
    supa.from("family_watchlist").select("id, ticker, company_name, status, champion_id, why_we_picked, how_they_make_money, what_they_sell, strength, risk, updated_at, wl_active").eq("family_id", ctx.household.id).order("updated_at", { ascending: false }).limit(24),
    supa.from("family_watchlist_votes").select("id, user_id, ticker, company_name, vote_night").eq("family_id", ctx.household.id).eq("vote_night", night),
  ]);
  const rows = (must(wl) as WatchRow[]).filter((r) => r.wl_active !== false);
  const vs = (votes.data ?? []) as VoteRow[];
  const nameOf = (id: string | null) => (id ? firstName(ctx.profiles.get(id)?.display_name, ctx.profiles.get(id)?.email) : "the family");
  const entries: WatchlistEntry[] = rows.map((r) => {
    const voters = vs.filter((v) => v.ticker === r.ticker).map((v) => nameOf(v.user_id));
    return { id: r.id, ticker: r.ticker, name: r.company_name ?? r.ticker, status: r.status ?? "watch", championId: r.champion_id, champion: nameOf(r.champion_id), why: r.why_we_picked ?? "", howTheyMakeMoney: r.how_they_make_money, whatTheySell: r.what_they_sell, strength: r.strength, risk: r.risk, updatedAgo: ago(r.updated_at), votes: voters.length, voters };
  });
  const myVote = vs.find((v) => v.user_id === ctx.household.me)?.ticker ?? null;
  const leader = [...entries].sort((a, b) => b.votes - a.votes)[0] ?? null;
  return { entries, myVote, leader: leader && leader.votes > 0 ? leader : null };
}

export async function getFamilyWatchlist(): Promise<FamilyWatchlist | null> {
  const ctx = await householdContext();
  if (!ctx) return null;
  return safe("family.watchlist", async () => {
    const night = todayIso();
    const w = await loadWatchlist(ctx, night);
    return { night, ...w, canVote: true };
  });
}

/* ── family night ──────────────────────────────────────────────────── */
const NIGHT_QUESTIONS: Record<string, string[]> = {
  kids: ["What does this company make or do?", "Where have we seen it in our own house?", "How do they get money from people?", "What would make you want to own a tiny piece of it?"],
  teens: ["What does this company sell, and who buys it?", "How does it actually make money?", "What could go wrong for it in the next few years?", "Would you rather own it, or a competitor — and why?"],
  adults: ["What does this company sell, and to whom?", "How does it make money, and is that durable?", "What is the biggest risk we can name?", "What would we need to learn before deciding anything?"],
};
export async function getFamilyNight(): Promise<NightState | null> {
  const ctx = await householdContext();
  if (!ctx) return null;
  return safe("family.night", async () => {
    const supa = await userClient();
    const night = todayIso();
    const [w, paid, hist] = await Promise.all([
      loadWatchlist(ctx, night),
      supa.from("xp_events").select("user_id").in("user_id", ctx.household.members.map((m) => m.id)).eq("ref_id", nightRef(night)),
      supa.from("family_night_sessions").select("id, night, ticker, company_name, host_id, attendee_ids").eq("family_id", ctx.household.id).order("night", { ascending: false }).limit(6),
    ]);
    const youngest = ctx.household.kids.find((k) => k.ageGroup === "kids") ?? ctx.household.kids[0] ?? null;
    const band = youngest?.ageGroup === "kids" ? "kids" : youngest ? "teens" : "adults";
    const hostName = (id: string | null) => (id ? firstName(ctx.profiles.get(id)?.display_name, ctx.profiles.get(id)?.email) : "A parent");
    return {
      night, label: new Date(`${night}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }), isParent: ctx.household.isParent,
      leader: w.leader, options: w.entries, myVote: w.myVote, questions: NIGHT_QUESTIONS[band], members: ctx.household.members,
      alreadyPaid: [...new Set(((paid.data ?? []) as { user_id: string }[]).map((r) => r.user_id))], xpPerAttendee: FAMILY_NIGHT_XP,
      history: ((hist.data ?? []) as NightRow[]).map((h) => ({ night: h.night, ticker: h.ticker, name: h.company_name, host: hostName(h.host_id), attendees: h.attendee_ids?.length ?? 0 })),
    };
  });
}

/* ── missions (the family challenge) ───────────────────────────────── */
export async function getFamilyMissions(): Promise<Mission[] | null> {
  const ctx = await householdContext();
  if (!ctx) return null;
  return safe("family.missions", async () => {
    const supa = await userClient();
    const [ms, done] = await Promise.all([
      supa.from("fic_missions").select("id, slug, title, description, kid_prompt, xp_reward, sort").order("sort"),
      supa.from("mission_completions").select("mission_id, user_id, completed_at").eq("family_id", ctx.household.id),
    ]);
    const rows = must(ms) as MissionRow[];
    if (!rows.length) return null;
    const by = new Map<string, string[]>();
    for (const c of ((done.data ?? []) as CompletionRow[])) by.set(c.mission_id, [...(by.get(c.mission_id) ?? []), c.user_id]);
    return rows.map((m) => ({ id: m.id, slug: m.slug, title: m.title, description: m.description ?? "", kidPrompt: m.kid_prompt, xp: m.xp_reward ?? 0, completedBy: by.get(m.id) ?? [], doneByMe: (by.get(m.id) ?? []).includes(ctx.household.me) }));
  });
}

/* ── profile settings / badges / progress (the member's own) ───────── */
export async function getProfileSettings(): Promise<ProfileSettings | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("family.profileSettings", async () => {
    const supa = await userClient();
    const row = must(await supa.from("profiles").select("id, display_name, username, avatar_url, role, age_group, comprehension_level, notification_prefs, email").eq("id", s.user.id).maybeSingle()) as (ProfileRow & { notification_prefs: Record<string, unknown> | null }) | null;
    if (!row) return null;
    const lvl = (row.comprehension_level ?? "").toLowerCase();
    return {
      id: row.id, email: s.user.email ?? row.email ?? "", displayName: row.display_name ?? "", username: row.username ?? "", avatarUrl: row.avatar_url && /^https?:\/\//.test(row.avatar_url) ? row.avatar_url : null,
      role: row.role, ageGroup: row.age_group, comprehensionLevel: lvl === "beginner" || lvl === "developing" || lvl === "proficient" ? lvl : null,
      notificationPrefs: row.notification_prefs ?? {}, familyName: s.family?.name ?? null, isKid: isChild(s),
    };
  });
}

const BADGE_HOW: Record<string, string> = { first: "Finish your first lesson.", lesson: "Keep finishing lessons.", quiz: "Ace a checkpoint quiz.", streak: "Keep a learning streak going.", research: "Write up a company for the family.", family: "Learn together on a Family Investing Night.", chart: "Score well in Chart Practice.", divers: "Hold companies across 3 sectors in practice.", debate: "Post helpful comments in the club." };
export async function getMyBadges(): Promise<MyBadges | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("family.myBadges", async () => {
    const supa = await userClient();
    const [all, mine] = await Promise.all([
      supa.from("badges").select("id, slug, title, description, subtitle, sort").order("sort"),
      supa.from("badge_awards").select("badge_id, awarded_at").eq("user_id", s.user.id),
    ]);
    const rows = must(all) as { id: string; slug: string; title: string; description: string | null; subtitle: string | null }[];
    const awarded = new Map(((mine.data ?? []) as { badge_id: string; awarded_at: string }[]).map((a) => [a.badge_id, a.awarded_at]));
    const how = (b: { slug: string; description: string | null; subtitle: string | null }) => b.description ?? b.subtitle ?? Object.entries(BADGE_HOW).find(([k]) => b.slug.includes(k))?.[1] ?? "Keep learning to unlock this one.";
    return {
      earned: rows.filter((b) => awarded.has(b.id)).map((b) => ({ id: b.id, emoji: badgeEmoji(b.slug), label: b.title, title: b.title, how: how(b), awardedAt: awarded.get(b.id)! })),
      locked: rows.filter((b) => !awarded.has(b.id)).map((b) => ({ id: b.id, emoji: badgeEmoji(b.slug), label: b.title, how: how(b) })),
    };
  });
}

export async function getMyProgress(): Promise<MyProgress | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("family.myProgress", async () => {
    const supa = await userClient();
    const since = new Date(Date.now() - 60 * 86400000).toISOString();
    const [xp, lessons, total, mastery] = await Promise.all([
      supa.from("xp_events").select("id, user_id, amount, kind, ref_id, created_at").eq("user_id", s.user.id).gte("created_at", since).order("created_at", { ascending: false }).limit(400),
      supa.from("lesson_progress").select("status, updated_at, lessons(title)").eq("user_id", s.user.id).order("updated_at", { ascending: false }).limit(200),
      supa.from("lessons").select("id, retired, modules!inner(courses!inner(published))").eq("modules.courses.published", true).limit(500),
      supa.from("skill_mastery").select("skill_id, mastery_score, skills(name, domain)").eq("user_id", s.user.id),
    ]);
    const rows = (xp.data ?? []) as (XpRow & { id: string })[];
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(dayStart.getTime() - (6 - i) * 86400000); return { key: d.toDateString(), d: ["S", "M", "T", "W", "T", "F", "S"][d.getDay()], full: d.toLocaleDateString("en-US", { weekday: "long" }), xp: 0 }; });
    const daySet = new Set<string>();
    for (const r of rows) {
      const k = new Date(r.created_at).toDateString();
      daySet.add(new Date(r.created_at).toISOString().slice(0, 10));
      const slot = week.find((w) => w.key === k);
      if (slot) slot.xp += r.amount ?? 0;
    }
    let streak = 0;
    for (let i = 0; i < 60; i++) { const d = new Date(dayStart.getTime() - i * 86400000).toISOString().slice(0, 10); if (daySet.has(d)) streak++; else if (i > 0) break; }
    const best = [...week].sort((a, b) => b.xp - a.xp)[0];
    const lp = (lessons.data ?? []) as unknown as { status: string | null; updated_at: string; lessons: { title: string } | null }[];
    const live = ((total.data ?? []) as { id: string; retired: boolean | null }[]).filter((l) => !l.retired).length;
    const byDomain = new Map<string, number[]>();
    for (const m of ((mastery.data ?? []) as unknown as { mastery_score: number; skills: { name: string | null; domain: string | null } | null }[])) {
      const key = m.skills?.domain ?? "General";
      byDomain.set(key, [...(byDomain.get(key) ?? []), m.mastery_score ?? 0]);
    }
    return {
      week: week.map((w) => ({ d: w.d, xp: w.xp })), weekXp: week.reduce((a, w) => a + w.xp, 0), bestDay: best && best.xp > 0 ? best.full : null,
      recent: rows.slice(0, 8).map((r) => ({ id: r.id, title: xpLabel(r.kind, r.ref_id), sub: ago(r.created_at) + " ago", xp: r.amount })),
      lessons: { completed: lp.filter((l) => l.status === "completed").length, total: live }, streakDays: streak,
      mastery: [...byDomain.entries()].map(([path, arr]) => ({ path: path.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), pct: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) })),
    };
  });
}

/* ── adapters for the shared data facade (src/lib/data-live.ts) ───── */
/** `Family` (the /family fixture shape) from the live household. */
export async function getFamilyLive(): Promise<Family | null> {
  const h = await getHousehold();
  if (!h) return null;
  const active = new Set<string>();
  for (const m of h.members) if (m.activeDaysThisWeek > 0) active.add(m.id);
  return {
    name: h.name, inviteCode: "", streakDays: 0, streakWeeks: 0,
    members: h.members.map((m) => ({ id: m.id, name: m.name, xp: m.weekXp, color: m.color, isYou: m.isYou })),
    weeklyChallenge: { title: "Run a Family Investing Night" }, portfolio: { value: 0, ytdPct: 0 },
  };
}
/** `FamilyLearner[]` from the live household (parents see every member; kids see nobody's report). */
export async function getLearnersLive(): Promise<FamilyLearner[] | null> {
  const h = await getHousehold();
  if (!h) return null;
  return h.members.map((m) => ({
    id: m.id, name: m.name, role: m.isKid ? (m.ageGroup === "teens" ? "teen" : "child") : "parent", level: m.level,
    pathTitle: "", pathProgress: 0, streak: m.activeDaysThisWeek, weekXp: m.weekXp, needs: [], tasks: [], lastActive: m.lastActive, color: m.color,
  }));
}
export const getLearnerLive = async (id: string) => (await getLearnersLive())?.find((l) => l.id === id) ?? null;
