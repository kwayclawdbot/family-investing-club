/**
 * The week's picks, from three places.
 *
 *  · Kai      — the engine's own setups (`alert_setups`), rolled up to the week. Kai posts daily;
 *               this screen is weekly, so a ticker Kai named more than once in the week appears
 *               once, at its strongest state, with the count kept.
 *  · Desk     — what the club published (`fic_picks`), with a thesis someone wrote and stands behind.
 *  · Members  — what members called (`fic_club_picks`), with the stance, the reason, and — once the
 *               week resolves — what it actually did.
 *
 * They are three different KINDS of claim and the screen never blends them: a machine setup, an
 * editorial call, and a member's opinion carry different weight, and pretending otherwise is how a
 * member ends up treating a stranger's guess as house research.
 */
import { supabase } from "../lib/supabase";

export type Lane = "kai" | "desk" | "members";

export type Pick = {
  id: string;
  lane: Lane;
  ticker: string;
  company: string | null;
  headline: string;
  detail: string | null;
  direction: "long" | "short" | "watch";
  at: string;
  /** Kai only — how many times the engine named it this week, and where the setup stands. */
  hits?: number;
  state?: string;
  entry?: number | null;
  /** Members only. */
  author?: string | null;
  confidence?: number | null;
  horizon?: string | null;
  returnPct?: number | null;
};

export type Week = { start: string; end: string; label: string };

/** Monday 00:00 through Sunday, in the member's own timezone. */
export function currentWeek(now = new Date()): Week {
  const d = new Date(now);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  const end = new Date(d);
  end.setDate(end.getDate() + 7);
  const fmt = (x: Date) => x.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const last = new Date(end); last.setDate(last.getDate() - 1);
  return { start: d.toISOString(), end: end.toISOString(), label: `${fmt(d)} – ${fmt(last)}` };
}

type SetupRow = {
  id: string; ticker: string; direction: string | null; thesis: string | null;
  entry: number | null; state: string | null; created_at: string;
};

/** Ranked by how far the setup got: a triggered call outranks one still waiting. */
const STATE_RANK: Record<string, number> = { triggered: 3, active: 3, armed: 2, waiting: 1, expired: 0, invalidated: 0 };

export async function loadKaiPicks(week: Week): Promise<Pick[]> {
  const { data, error } = await supabase
    .from("alert_setups")
    .select("id, ticker, direction, thesis, entry, state, created_at")
    .gte("created_at", week.start)
    .lt("created_at", week.end)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const byTicker = new Map<string, { row: SetupRow; hits: number }>();
  for (const row of (data ?? []) as SetupRow[]) {
    const found = byTicker.get(row.ticker);
    if (!found) { byTicker.set(row.ticker, { row, hits: 1 }); continue; }
    found.hits += 1;
    const better = (STATE_RANK[row.state ?? ""] ?? 0) > (STATE_RANK[found.row.state ?? ""] ?? 0);
    if (better) found.row = row;
  }

  return [...byTicker.values()]
    .sort((a, b) => (STATE_RANK[b.row.state ?? ""] ?? 0) - (STATE_RANK[a.row.state ?? ""] ?? 0) || b.hits - a.hits)
    .map(({ row, hits }) => ({
      id: row.id, lane: "kai" as const, ticker: row.ticker, company: null,
      headline: titleCase(row.thesis ?? "Setup"), detail: null,
      direction: (row.direction === "short" ? "short" : row.direction === "long" ? "long" : "watch"),
      at: row.created_at, hits, state: row.state ?? "waiting", entry: row.entry,
    }));
}

export async function loadDeskPicks(week: Week): Promise<Pick[]> {
  const { data, error } = await supabase
    .from("fic_picks")
    .select("id, ticker, company_name, headline, thesis_short, picked_at, status")
    .eq("status", "published")
    .gte("picked_at", week.start.slice(0, 10))
    .lt("picked_at", week.end.slice(0, 10))
    .order("picked_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as { id: string; ticker: string; company_name: string; headline: string | null; thesis_short: string | null; picked_at: string }[])
    .map((r) => ({
      id: r.id, lane: "desk" as const, ticker: r.ticker, company: r.company_name,
      headline: r.headline ?? r.company_name, detail: r.thesis_short, direction: "long" as const, at: r.picked_at,
    }));
}

export async function loadMemberPicks(week: Week): Promise<Pick[]> {
  // `author_id` carries no foreign key to `profiles`, so PostgREST cannot embed the author and a
  // `profiles:author_id(...)` select is a 400. The names are fetched in a second round trip.
  const { data, error } = await supabase
    .from("fic_club_picks")
    .select("id, symbol, company_name, stance, reason, horizon, confidence, resolved_return_pct, created_at, author_id")
    .gte("created_at", week.start)
    .lt("created_at", week.end)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;

  type Row = {
    id: string; symbol: string; company_name: string | null; stance: string; reason: string;
    horizon: string; confidence: number; resolved_return_pct: number | null; created_at: string; author_id: string;
  };
  const rows = (data ?? []) as Row[];
  if (!rows.length) return [];

  const names = await displayNames([...new Set(rows.map((r) => r.author_id))]);

  return rows.map((r) => ({
    id: r.id, lane: "members" as const, ticker: r.symbol, company: r.company_name,
    headline: r.company_name ?? r.symbol, detail: r.reason,
    direction: (r.stance === "short" || r.stance === "bearish" ? "short" : r.stance === "watch" ? "watch" : "long") as Pick["direction"],
    at: r.created_at, author: names.get(r.author_id) ?? null, confidence: r.confidence,
    horizon: r.horizon, returnPct: r.resolved_return_pct,
  }));
}

/** Author names, looked up by id. Shared by anything that shows who said something. */
export async function displayNames(ids: string[]): Promise<Map<string, string | null>> {
  if (!ids.length) return new Map();
  const { data } = await supabase.from("profiles").select("id, display_name").in("id", ids);
  return new Map(((data ?? []) as { id: string; display_name: string | null }[]).map((p) => [p.id, p.display_name]));
}

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
