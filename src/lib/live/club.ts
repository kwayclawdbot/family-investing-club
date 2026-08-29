import "server-only";
import type {
  BeltColor, ChildHome, Club, ClubActivity, ClubHolding, ClubMember, ClubOverview, ClubPortfolio, ClubProposal, Comment, JournalEntry,
  Member, MemberCard, MemberIdentity, Pick, PortfolioTab, ResearchAssignment,
} from "@/lib/types";
import * as fx from "@/lib/fixtures/club";
import * as ws from "@/lib/fixtures/workspace";
import { beltFor } from "@/lib/belts";
import { cache } from "react";
import { getSession, levelOf, type ProfileRow } from "./session";
import { identitiesFor } from "./identity";
import { quotesSafe } from "./market-bridge";
import { ago, colorFor, endsIn, firstName, hoursLeft, initialOf, must, safe, userClient } from "./supa";

/* ── rows ─────────────────────────────────────────────────────────── */
type ClubRow = { id: string; name: string; short_name: string | null; kind: Club["kind"]; privacy: Club["privacy"]; founder_id: string; invite_code: string; rules: Club["rules"]; investing_night: { when?: string; topic?: string | null }; created_at: string; family_id: string | null };
type MemberRow = { club_id: string; user_id: string; role: ClubMember["role"]; vote_gated: boolean; gate_reason: string | null; joined_at: string };
type PickRow = { id: string; club_id: string | null; author_id: string; symbol: string; company_name: string | null; stance: Pick["stance"]; reason: string; horizon: Pick["horizon"]; confidence: number; visibility: Pick["visibility"]; price_at_pick: number | null; verified_owner: boolean; resolved_return_pct: number | null; created_at: string };
type ReplyRow = { id: string; pick_id: string; author_id: string; body: string; created_at: string };
type ReactionRow = { pick_id: string; user_id: string; kind: "agree" | "not_sure" };
type ProposalRow = { id: string; club_id: string; author_id: string; kind: ClubProposal["kind"]; symbol: string; company_name: string | null; from_weight_pct: number; to_weight_pct: number; rationale: string; evidence: { label: string; href: string }[]; concept_gate: ClubProposal["conceptGate"] | null; closes_at: string; status: "open" | "passed" | "rejected" | "withdrawn"; created_at: string };
type VoteRow = { proposal_id: string; user_id: string; vote: "for" | "against" };
type HoldingRow = { club_id: string; symbol: string; company_name: string | null; weight_pct: number; origin: string | null; proposal_id: string | null; added_at: string };
type DecisionRow = { id: string; decided_on: string; title: string; by_user: string | null; vote_result: string | null; believed: string | null; wrong_if: string | null; review: string | null; learned: string | null };
type ResearchRow = { id: string; symbol: string; company_name: string | null; assignee_id: string | null; reason: string | null; due_label: string | null; status: "open" | "ready" | "done"; notes: string | null; created_at: string };
type ActivityRow = { club_id: string; actor_id: string | null; kind: "pick" | "proposal" | "research"; symbol: string; detail: string; ref_id: string; created_at: string };

/* ── the member's club (memoised per request) ──────────────────────── */
export type ClubContext = { club: ClubRow; members: MemberRow[]; profiles: Map<string, ProfileRow>; me: string };

export const clubContext = cache(async (): Promise<ClubContext | null> => {
  const s = await getSession();
  if (!s) return null;
  return safe("club.context", async () => {
    const supa = await userClient();
    const mine = must(await supa.from("fic_club_members").select("club_id").eq("user_id", s.user.id).order("joined_at").limit(1)) as { club_id: string }[];
    if (!mine.length) return null;
    const clubId = mine[0].club_id;
    const [club, members] = await Promise.all([
      supa.from("fic_clubs").select("*").eq("id", clubId).single(),
      supa.from("fic_club_members").select("*").eq("club_id", clubId),
    ]);
    const c = must(club) as ClubRow;
    const ms = must(members) as MemberRow[];
    const profs = must(await supa.from("profiles").select("id, family_id, role, display_name, email, age_group, comprehension_level, onboarding_complete, username").in("id", ms.map((m) => m.user_id))) as ProfileRow[];
    return { club: c, members: ms, profiles: new Map(profs.map((p) => [p.id, p])), me: s.user.id };
  });
});

function nameOf(ctx: ClubContext, userId: string | null | undefined): string {
  if (!userId) return "Someone";
  const p = ctx.profiles.get(userId);
  return firstName(p?.display_name, p?.email) || "Member";
}
function toMember(ctx: ClubContext, m: MemberRow): ClubMember {
  const p = ctx.profiles.get(m.user_id);
  const name = nameOf(ctx, m.user_id);
  return { id: m.user_id, name, initial: initialOf(name), color: colorFor(m.user_id), role: m.role, level: levelOf(p), isYou: m.user_id === ctx.me, voteGated: m.vote_gated || undefined, gateReason: m.gate_reason ?? undefined };
}

export async function getClub(): Promise<Club | null> {
  const ctx = await clubContext();
  if (!ctx) return null;
  const c = ctx.club;
  return {
    id: c.id, name: c.name, shortName: c.short_name ?? c.name, kind: c.kind, privacy: c.privacy, est: new Date(c.created_at).getFullYear().toString(),
    members: ctx.members.map((m) => toMember(ctx, m)),
    inviteCode: c.invite_code, inviteLink: `fic.club/join/${c.invite_code}`,
    rules: { votes: c.rules?.votes ?? "majority", kidsCanVote: c.rules?.kidsCanVote ?? true, maxWeightPct: c.rules?.maxWeightPct ?? 10, weeklyPrompt: c.rules?.weeklyPrompt ?? "Thu 7 PM" },
    streakWeeks: Math.max(1, Math.floor((Date.now() - new Date(c.created_at).getTime()) / (7 * 86400000))),
    investingNight: { when: c.investing_night?.when ?? "Thu 7 PM", topic: c.investing_night?.topic ?? "" },
  };
}

/* ── picks ─────────────────────────────────────────────────────────── */
async function hydratePicks(ctx: ClubContext | null, rows: PickRow[]): Promise<Pick[]> {
  const supa = await userClient();
  const ids = rows.map((r) => r.id);
  const [replies, reactions] = ids.length
    ? await Promise.all([
        supa.from("fic_club_pick_replies").select("*").in("pick_id", ids).order("created_at"),
        supa.from("fic_club_pick_reactions").select("*").in("pick_id", ids),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  const rs = (replies.data ?? []) as ReplyRow[];
  const xs = (reactions.data ?? []) as ReactionRow[];
  const authorName = (id: string) => (ctx ? nameOf(ctx, id) : "Member");
  return rows.map((r) => ({
    id: r.id, clubId: r.club_id ?? "public", authorId: r.author_id, author: authorName(r.author_id), ago: ago(r.created_at),
    symbol: r.symbol, name: r.company_name ?? r.symbol, stance: r.stance, reason: r.reason, horizon: r.horizon,
    confidence: Math.min(5, Math.max(1, r.confidence)) as Pick["confidence"], priceAtPick: Number(r.price_at_pick ?? 0),
    agree: xs.filter((x) => x.pick_id === r.id && x.kind === "agree").length,
    notSure: xs.filter((x) => x.pick_id === r.id && x.kind === "not_sure").length,
    replies: rs.filter((x) => x.pick_id === r.id).map<Comment>((x) => ({ id: x.id, author: authorName(x.author_id), ago: ago(x.created_at), text: x.body })),
    visibility: r.visibility,
  }));
}

export async function getPicks(): Promise<Pick[] | null> {
  const ctx = await clubContext();
  if (!ctx) return null;
  return safe("club.getPicks", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("fic_club_picks").select("*").eq("club_id", ctx.club.id).order("created_at", { ascending: false }).limit(50)) as PickRow[];
    return hydratePicks(ctx, rows);
  });
}

export async function getPick(id: string): Promise<Pick | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null; // fixture ids are slugs
  const ctx = await clubContext();
  return safe("club.getPick", async () => {
    const supa = await userClient();
    const row = must(await supa.from("fic_club_picks").select("*").eq("id", id).maybeSingle()) as PickRow | null;
    if (!row) return null;
    return (await hydratePicks(ctx, [row]))[0];
  });
}

/* ── proposals ─────────────────────────────────────────────────────── */
async function hydrateProposals(ctx: ClubContext, rows: ProposalRow[], portfolioValue: number): Promise<ClubProposal[]> {
  const supa = await userClient();
  const ids = rows.map((r) => r.id);
  const votes = ids.length ? ((await supa.from("fic_club_votes").select("*").in("proposal_id", ids)).data ?? []) as VoteRow[] : [];
  return rows.map((r) => ({
    id: r.id, clubId: r.club_id, kind: r.kind, symbol: r.symbol, name: r.company_name ?? r.symbol,
    fromWeightPct: Number(r.from_weight_pct), toWeightPct: Number(r.to_weight_pct),
    practiceDollars: Math.round((Number(r.to_weight_pct) - Number(r.from_weight_pct)) / 100 * portfolioValue),
    by: nameOf(ctx, r.author_id), byId: r.author_id, postedAgo: ago(r.created_at), endsIn: endsIn(r.closes_at),
    rationale: r.rationale, evidence: r.evidence ?? [], conceptGate: r.concept_gate ?? undefined,
    votes: ctx.members.map((m) => ({ memberId: m.user_id, vote: votes.find((v) => v.proposal_id === r.id && v.user_id === m.user_id)?.vote ?? null })),
    status: r.status === "withdrawn" ? "rejected" : r.status,
  }));
}

export async function getProposals(): Promise<ClubProposal[] | null> {
  const ctx = await clubContext();
  if (!ctx) return null;
  return safe("club.getProposals", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("fic_club_proposals").select("*").eq("club_id", ctx.club.id).order("created_at", { ascending: false })) as ProposalRow[];
    const value = (await portfolioNumbers(ctx))?.value ?? fx.clubPortfolio.value;
    return hydrateProposals(ctx, rows, value);
  });
}

export async function getProposal(id: string): Promise<ClubProposal | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const ctx = await clubContext();
  if (!ctx) return null;
  return safe("club.getProposal", async () => {
    const supa = await userClient();
    const row = must(await supa.from("fic_club_proposals").select("*").eq("id", id).maybeSingle()) as ProposalRow | null;
    if (!row) return null;
    const value = (await portfolioNumbers(ctx))?.value ?? fx.clubPortfolio.value;
    return (await hydrateProposals(ctx, [row], value))[0];
  });
}

/* ── portfolio ─────────────────────────────────────────────────────── */
type Numbers = { value: number; ytdPct: number; holdings: ClubHolding[]; quotesLive: boolean };
const portfolioNumbers = cache(async (ctx: ClubContext): Promise<Numbers | null> => {
  return safe("club.portfolioNumbers", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("fic_club_holdings").select("*").eq("club_id", ctx.club.id).order("weight_pct", { ascending: false })) as HoldingRow[];
    if (!rows.length) return null;
    const quotes = await quotesSafe(rows.map((r) => r.symbol));
    const live = Object.keys(quotes).length > 0;
    const fxBySym = new Map(fx.clubPortfolio.holdings.map((h) => [h.symbol, h]));
    const holdings: ClubHolding[] = rows.map((r) => ({
      symbol: r.symbol, name: r.company_name ?? r.symbol, weightPct: Number(r.weight_pct),
      returnPct: quotes[r.symbol]?.changePct ?? fxBySym.get(r.symbol)?.returnPct ?? 0,
      origin: r.origin ?? "", proposalId: r.proposal_id ?? undefined,
    }));
    // Practice dollars: the fixture's starting value scaled by weighted returns when quotes are live.
    const base = fx.clubPortfolio.value;
    const ytdPct = live ? +(holdings.reduce((a, h) => a + (h.weightPct / 100) * h.returnPct, 0)).toFixed(2) : fx.clubPortfolio.ytdPct;
    return { value: live ? Math.round(base * (1 + ytdPct / 100)) : base, ytdPct, holdings, quotesLive: live };
  });
});

export async function getClubPortfolio(): Promise<ClubPortfolio | null> {
  const ctx = await clubContext();
  if (!ctx) return null;
  return safe("club.getClubPortfolio", async () => {
    const supa = await userClient();
    const [nums, decisions] = await Promise.all([
      portfolioNumbers(ctx),
      supa.from("fic_club_decisions").select("*").eq("club_id", ctx.club.id).order("decided_on", { ascending: false }),
    ]);
    if (!nums) return null;
    const ds = must(decisions) as DecisionRow[];
    const journal: JournalEntry[] = ds.map((d) => ({
      date: new Date(d.decided_on + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      title: d.title, believed: d.believed ?? undefined, wrongIf: d.wrong_if ?? undefined, review: d.review ?? undefined, learned: d.learned ?? undefined,
    }));
    return { clubId: ctx.club.id, name: `${ctx.club.short_name ?? ctx.club.name} Portfolio`, value: nums.value, ytdPct: nums.ytdPct, benchmarkYtdPct: fx.clubPortfolio.benchmarkYtdPct, holdings: nums.holdings, journal, series: fx.clubPortfolio.series };
  });
}

/* ── research + activity ───────────────────────────────────────────── */
export async function getResearch(): Promise<ResearchAssignment[] | null> {
  const ctx = await clubContext();
  if (!ctx) return null;
  return safe("club.getResearch", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("fic_club_research").select("*").eq("club_id", ctx.club.id).order("created_at", { ascending: false })) as ResearchRow[];
    return rows.map((r) => ({
      id: r.id, symbol: r.symbol, name: r.company_name ?? r.symbol, assigneeId: r.assignee_id ?? "", assignee: r.assignee_id === ctx.me ? "you" : nameOf(ctx, r.assignee_id),
      due: r.due_label ?? "", status: r.status === "open" ? "open" : "done", notes: r.notes ?? undefined, reason: r.reason ?? "",
    }));
  });
}

export async function getClubActivity(): Promise<ClubActivity[] | null> {
  const ctx = await clubContext();
  if (!ctx) return null;
  return safe("club.getClubActivity", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("fic_club_activity").select("*").eq("club_id", ctx.club.id).order("created_at", { ascending: false }).limit(12)) as ActivityRow[];
    return rows.map((r) => {
      const actor = nameOf(ctx, r.actor_id);
      if (r.kind === "pick") return { id: r.ref_id, actorId: r.actor_id ?? "", actor, ago: ago(r.created_at), kind: "pick" as const, text: `made a Pick: ${r.symbol} · ${r.detail.toUpperCase()}`, href: `/club/pick/${r.ref_id}` };
      if (r.kind === "proposal") return { id: r.ref_id, actorId: r.actor_id ?? "", actor, ago: ago(r.created_at), kind: "vote" as const, text: `proposed ${r.detail} ${r.symbol}`, href: `/club/vote/${r.ref_id}` };
      return { id: r.ref_id, actorId: r.actor_id ?? "", actor, ago: ago(r.created_at), kind: "research" as const, text: `finished ${r.symbol} research`, href: "/club/research" };
    });
  });
}

/* ── composed views ────────────────────────────────────────────────── */
export async function memberIdentities(ctx: ClubContext): Promise<MemberIdentity[]> {
  const ids = await identitiesFor(ctx.members.map((m) => ({ id: m.user_id, name: nameOf(ctx, m.user_id) })));
  return ids ?? ctx.members.map((m) => { const n = nameOf(ctx, m.user_id); return { memberId: m.user_id, name: n, initial: initialOf(n), color: colorFor(m.user_id), lifetimeXp: 0, weekXp: 0 }; });
}

export async function getClubOverview(): Promise<ClubOverview | null> {
  const ctx = await clubContext();
  if (!ctx) return null;
  return safe("club.getClubOverview", async () => {
    const supa = await userClient();
    const [nums, picks, proposals, research, activity, links] = await Promise.all([
      portfolioNumbers(ctx), getPicks(), getProposals(), getResearch(), getClubActivity(),
      supa.from("fic_brokerage_links").select("user_id, synced_at").in("user_id", ctx.members.map((m) => m.user_id)),
    ]);
    const base = ws.clubOverview;
    const ps = picks ?? [];
    const resolved = ps.filter((p) => p.priceAtPick > 0);
    const quotes = await quotesSafe([...new Set(resolved.map((p) => p.symbol))]);
    const withRet = resolved.map((p) => ({ p, ret: quotes[p.symbol] ? ((quotes[p.symbol].price - p.priceAtPick) / p.priceAtPick) * 100 : null })).filter((x) => x.ret !== null) as { p: Pick; ret: number }[];
    const best = withRet.sort((a, b) => b.ret - a.ret)[0];
    const byAuthor = new Map<string, { n: number; sum: number; name: string }>();
    for (const { p, ret } of withRet) { const cur = byAuthor.get(p.authorId) ?? { n: 0, sum: 0, name: p.author }; cur.n++; cur.sum += ret; byAuthor.set(p.authorId, cur); }
    const top = [...byAuthor.entries()].map(([id, v]) => ({ memberId: id, name: id === ctx.me ? `${v.name} (you)` : v.name, picks: v.n, ytdPct: +(v.sum / v.n).toFixed(1) })).sort((a, b) => b.ytdPct - a.ytdPct).slice(0, 3).map((t, i) => ({ rank: i + 1, ...t }));
    const open = (proposals ?? []).find((p) => p.status === "open");
    const adults = ctx.members.filter((m) => m.role !== "child");
    const linkRows = (links.data ?? []) as { user_id: string; synced_at: string | null }[];
    const gatedNames = ctx.members.filter((m) => m.vote_gated).map((m) => nameOf(ctx, m.user_id));
    return {
      members: ctx.members.length, households: 1, streakWeeks: Math.max(1, Math.floor((Date.now() - new Date(ctx.club.created_at).getTime()) / (7 * 86400000))),
      value: nums?.value ?? base.value, ytdPct: nums?.ytdPct ?? base.ytdPct, benchmarkPct: base.benchmarkPct, ranges: base.ranges, series: base.series,
      metrics: {
        bestPick: best ? { symbol: best.p.symbol, pct: Math.round(best.ret), by: best.p.author } : base.metrics.bestPick,
        winRatePct: withRet.length ? Math.round((withRet.filter((x) => x.ret > 0).length / withRet.length) * 100) : base.metrics.winRatePct,
        resolved: withRet.length || base.metrics.resolved,
        verified: { connected: linkRows.length, adults: adults.length, syncedAgo: linkRows[0]?.synced_at ? ago(linkRows[0].synced_at) + " ago" : "—" },
      },
      topInvestors: top.length ? top : base.topInvestors,
      boards: base.boards,
      activeDecision: open ? { proposalId: open.id, title: `${open.kind === "add" ? "Add" : open.kind === "remove" ? "Remove" : "Add"} ${open.symbol} · ${open.fromWeightPct}% → ${open.toWeightPct}%`, by: open.by, hoursLeft: hoursLeft((proposals ?? []).length ? undefined : undefined) || Math.max(1, Math.round(parseFloat(open.endsIn) || 1) * (open.endsIn.includes("day") ? 24 : 1)), voted: open.votes.filter((v) => v.vote).length, eligible: ctx.members.filter((m) => !m.vote_gated).length, waitingOn: gatedNames[0] ? `${gatedNames[0]} 🎓` : undefined } : null,
      research: (research ?? []).slice(0, 4).map((r) => ({ symbol: r.symbol, name: r.name, assigneeId: r.assigneeId, assignee: r.assignee === "you" ? "you" : r.assignee, gated: ctx.members.find((m) => m.user_id === r.assigneeId)?.vote_gated || undefined, due: r.due, note: r.notes, status: r.status === "open" ? "open" : "ready" })),
      happened: (activity ?? []).slice(0, 5).map((a) => ({ id: a.id, actorId: a.actorId, actor: a.actor, text: a.text.replace(/^made a Pick: /, "picked "), ago: a.ago })),
    };
  });
}

export async function getPortfolioTab(): Promise<PortfolioTab | null> {
  const ctx = await clubContext();
  if (!ctx) return null;
  return safe("club.getPortfolioTab", async () => {
    const [nums, port, proposals] = await Promise.all([portfolioNumbers(ctx), getClubPortfolio(), getProposals()]);
    if (!nums || !port) return null;
    const base = ws.portfolioTab;
    const contrib = nums.holdings.map((h) => ({ symbol: h.symbol, pp: +((h.weightPct / 100) * h.returnPct).toFixed(1) })).sort((a, b) => b.pp - a.pp);
    const openFor = (sym: string) => (proposals ?? []).find((p) => p.symbol === sym && p.status === "open");
    const passedFor = (id?: string) => (proposals ?? []).find((p) => p.id === id);
    return {
      allocation: base.allocation,
      contributor: contrib[0] ?? base.contributor, detractor: contrib[contrib.length - 1] ?? base.detractor,
      holdings: nums.holdings.map((h) => {
        const o = openFor(h.symbol); const pr = passedFor(h.proposalId);
        return { symbol: h.symbol, name: h.name, weightPct: h.weightPct, returnPct: h.returnPct, link: o ? { label: `open proposal ↑${o.toWeightPct}%`, href: `/club/vote/${o.id}` } : pr ? { label: `vote ${pr.votes.filter((v) => v.vote === "for").length}-${pr.votes.filter((v) => v.vote === "against").length} →`, href: `/club/vote/${pr.id}` } : undefined };
      }),
      concentration: base.concentration,
      journal: port.journal.map((j) => ({ date: j.date, title: j.title, believed: j.believed, wrongIf: j.wrongIf, review: j.review, learned: j.learned })),
    };
  });
}

export async function getMemberCards(): Promise<MemberCard[] | null> {
  const ctx = await clubContext();
  if (!ctx) return null;
  return safe("club.getMemberCards", async () => {
    const supa = await userClient();
    const [ids, picks, research, links] = await Promise.all([
      memberIdentities(ctx), getPicks(), getResearch(),
      supa.from("fic_brokerage_links").select("user_id, public_badge").in("user_id", ctx.members.map((m) => m.user_id)),
    ]);
    const linkSet = new Set(((links.data ?? []) as { user_id: string }[]).map((l) => l.user_id));
    return ctx.members.map((m) => {
      const id = ids.find((i) => i.memberId === m.user_id);
      const mine = (picks ?? []).filter((p) => p.authorId === m.user_id);
      const notes = (research ?? []).filter((r) => r.assigneeId === m.user_id && r.status === "done").length;
      const child = m.role === "child";
      const trust: MemberCard["trust"] = child ? "practice" : linkSet.has(m.user_id) ? "verified" : "self-reported";
      const facts = [child ? "Practice only" : trust === "verified" ? "✓ Verified" : "Self-reported", `${mine.length} picks`, notes ? `${notes} research notes` : null].filter(Boolean) as string[];
      return { memberId: m.user_id, name: nameOf(ctx, m.user_id), role: m.role === "founder" ? "OWNER" : m.role === "admin" ? "ADMIN" : child ? "PRACTICE INVESTOR 🎓" : undefined, trust, facts, xpWeek: id?.weekXp ?? 0, picksYtdPct: 0 };
    });
  });
}

export async function getChildHome(): Promise<ChildHome | null> {
  const s = await getSession();
  const ctx = await clubContext();
  if (!s || !ctx) return null;
  const level = levelOf(s.profile);
  if (level !== "Explorer" && level !== "Builder") return null;
  return safe("club.getChildHome", async () => {
    const [research, proposals] = await Promise.all([getResearch(), getProposals()]);
    const mine = (research ?? []).find((r) => r.assigneeId === ctx.me && r.status === "open");
    const open = (proposals ?? []).find((p) => p.status === "open");
    const me = ctx.members.find((m) => m.user_id === ctx.me);
    const base = fx.childHome;
    return {
      name: nameOf(ctx, ctx.me), level, streakDays: base.streakDays,
      familyRequest: mine ? { fromId: "", from: "Your family", symbol: mine.symbol, name: mine.name, text: mine.reason || "What do you think?" } : undefined,
      nextLesson: base.nextLesson,
      practice: base.practice,
      familyVote: open ? { proposalId: open.id, text: `${open.kind === "remove" ? "Remove" : "Add"} ${open.symbol}? ${me?.vote_gated ? "Finish the mini-lesson to vote" : "Your vote counts"}`, gated: !!me?.vote_gated } : undefined,
      newBadge: undefined,
      investingNight: { when: ctx.club.investing_night?.when ?? "Thu", text: ctx.club.investing_night?.topic ?? "" },
    };
  });
}

/** Belt-aware identities for the club (used by leaderboards). */
export async function getIdentities(): Promise<MemberIdentity[] | null> {
  const ctx = await clubContext();
  if (!ctx) return null;
  return safe("club.getIdentities", () => memberIdentities(ctx));
}

export function beltLabelFor(xp: number) { return beltFor(xp).short; }

/* ── vote gate (Phase 2): one predicate, used by /api/club/vote and the smoke ── */
/** Why this member may not vote right now, or null when they can. `vote_gated` is set on fic_club_members (mini-lesson gate); `rules.kidsCanVote=false` blocks the child role. */
export function voteRefusal(ctx: ClubContext, userId: string): string | null {
  const me = ctx.members.find((m) => m.user_id === userId);
  if (!me) return "You're not a member of this club";
  if (me.vote_gated) return me.gate_reason ? `Finish the mini-lesson first — ${me.gate_reason}` : "Your vote is gated until you finish the mini-lesson";
  if (me.role === "child" && ctx.club.rules?.kidsCanVote === false) return "Kids can't vote in this club yet — a grown-up can change that in club settings";
  return null;
}

/* ── asks (questions to the club) ──────────────────────────────────── */
type AskRow = { id: string; author_id: string; question: string; symbol: string | null; created_at: string };
export type ClubAsk = { id: string; authorId: string; author: string; ago: string; at: string; question: string; symbol?: string; mine: boolean };
export async function getAsks(limit = 30): Promise<ClubAsk[] | null> {
  const ctx = await clubContext();
  if (!ctx) return null;
  return safe("club.getAsks", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("fic_club_asks").select("id, author_id, question, symbol, created_at").eq("club_id", ctx.club.id).order("created_at", { ascending: false }).limit(limit)) as AskRow[];
    return rows.map((r) => ({ id: r.id, authorId: r.author_id, author: nameOf(ctx, r.author_id), ago: ago(r.created_at), at: r.created_at, question: r.question, symbol: r.symbol ?? undefined, mine: r.author_id === ctx.me }));
  });
}

/* ── private club chat ──────────────────────────────────────────────
 * One club = one family (Decision #51), so the private club thread is FTA's household thread
 * `family_circle_messages` (migration 192): family-scoped RLS, kids may write, guardrails apply.
 * `chat_messages` cannot host it — its SELECT policy only exposes the six global community rooms.
 * Friends/mixed clubs (no family_id) get null → the UI says chat lives with the family club. */
type FamilyMsgRow = { id: string; author_id: string | null; kind: "message" | "system"; body: string; created_at: string };
export type ClubChatMessage = { id: string; kind: "message" | "system"; authorId: string | null; author: string; initial: string; color: string; belt: BeltColor | null; beltLabel?: string; child: boolean; text: string; at: string; time: string; mine: boolean };
function clock(iso: string) { return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
export async function chatFamilyId(): Promise<string | null> {
  const ctx = await clubContext();
  if (!ctx) return null;
  if (ctx.club.family_id) return ctx.club.family_id;
  const s = await getSession();
  return s?.profile?.family_id ?? null;
}
export async function getClubChat(limit = 60): Promise<ClubChatMessage[] | null> {
  const ctx = await clubContext();
  const familyId = await chatFamilyId();
  if (!ctx || !familyId) return null;
  return safe("club.getClubChat", async () => {
    const supa = await userClient();
    const [rows, ids] = await Promise.all([
      supa.from("family_circle_messages").select("id, author_id, kind, body, created_at").eq("family_id", familyId).order("created_at", { ascending: false }).limit(limit),
      memberIdentities(ctx),
    ]);
    const ms = (must(rows) as FamilyMsgRow[]).slice().reverse();
    return ms.map((m) => {
      const name = m.author_id ? nameOf(ctx, m.author_id) : "Club";
      const xp = ids.find((i) => i.memberId === m.author_id)?.lifetimeXp ?? 0;
      const belt = m.author_id ? beltFor(xp) : null;
      const member = ctx.members.find((x) => x.user_id === m.author_id);
      return { id: m.id, kind: m.kind, authorId: m.author_id, author: name, initial: initialOf(name), color: m.author_id ? colorFor(m.author_id) : "bg-ink-4", belt: belt?.color ?? null, beltLabel: belt?.short, child: member?.role === "child", text: m.body, at: m.created_at, time: clock(m.created_at), mine: m.author_id === ctx.me };
    });
  });
}

/* ── a member's public card (replaces the fixture Member for real ids) ── */
export async function getClubMemberProfile(userId: string): Promise<Member | null> {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return null;
  const ctx = await clubContext();
  if (!ctx) return null;
  const m = ctx.members.find((x) => x.user_id === userId);
  if (!m) return null;
  return safe("club.getClubMemberProfile", async () => {
    const supa = await userClient();
    const [picks, replies] = await Promise.all([
      supa.from("fic_club_picks").select("symbol").eq("author_id", userId).order("created_at", { ascending: false }).limit(50),
      supa.from("fic_club_pick_replies").select("id", { count: "exact", head: true }).eq("author_id", userId),
    ]);
    const p = ctx.profiles.get(userId);
    const name = nameOf(ctx, userId);
    const child = m.role === "child";
    const symbols = [...new Set(((picks.data ?? []) as { symbol: string }[]).map((x) => x.symbol))];
    return {
      id: userId, name,
      role: m.role === "founder" ? "Club owner" : m.role === "admin" ? "Club admin" : child ? "Practice investor" : "Member",
      level: levelOf(p),
      bio: child ? "" : `${name} is a member of ${ctx.club.short_name ?? ctx.club.name}.`,
      badges: [], favorites: symbols.slice(0, 6), ideas: symbols.length ? ((picks.data ?? []) as unknown[]).length : 0, comments: replies.count ?? 0,
      joined: new Date(m.joined_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      ageBadge: child ? "Young learner" : undefined,
    };
  });
}
