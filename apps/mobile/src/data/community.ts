/**
 * The club.
 *
 * Two things only: what members are saying (`feed_posts`) and who is putting the work in
 * (`xp_events`, aggregated). A leaderboard on XP is honest here in a way it usually is not, because
 * XP in this app is participation rather than a score — it says who showed up, not who is right.
 */
import { supabase } from "../lib/supabase";

export type Post = {
  id: string; author: string | null; body: string; title: string | null;
  tickers: string[]; kind: string | null; at: string; pinned: boolean; likes: number;
  /** Set on `kind: "activity"` posts, whose content lives in a payload rather than a body. */
  activity: { icon: string | null; sentence: string } | null;
};

type ActivityPayload = {
  type?: string; actor_name?: string; level_name?: string; level?: number;
  target?: string; detail?: string; icon?: string; family_name?: string;
};

/**
 * An activity post has an empty body on purpose — what happened is in the payload. Rendering the
 * body would put four blank rows in the feed, and a blank row reads as a broken post rather than as
 * "there is nothing here". This turns the payload into the sentence it always meant.
 */
function activitySentence(p: ActivityPayload | null): { icon: string | null; sentence: string } | null {
  if (!p) return null;
  const who = p.actor_name ?? "A member";
  switch (p.type) {
    case "level_up": return { icon: p.icon ?? null, sentence: `${who} reached ${p.level_name ?? p.target ?? `level ${p.level}`}` };
    case "lesson_complete": return { icon: p.icon ?? null, sentence: `${who} finished ${p.target ?? "a lesson"}` };
    case "belt_award": return { icon: p.icon ?? null, sentence: `${who} earned their ${p.target ?? "belt"}` };
    case "joined": return { icon: p.icon ?? null, sentence: `${who} joined${p.family_name ? ` ${p.family_name}` : ""}` };
    default: {
      const what = p.detail ?? p.target ?? p.type;
      return what ? { icon: p.icon ?? null, sentence: `${who} — ${what}` } : null;
    }
  }
}

export async function loadFeed(limit = 40): Promise<Post[]> {
  const { data, error } = await supabase
    .from("feed_posts")
    .select("id, body, title, kind, ticker_tags, pinned, created_at, author_id, activity_payload, profiles:author_id(display_name)")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  type Row = {
    id: string; body: string | null; title: string | null; kind: string | null;
    ticker_tags: string[] | null; pinned: boolean | null; created_at: string;
    activity_payload: ActivityPayload | null;
    profiles: { display_name: string | null } | { display_name: string | null }[] | null;
  };
  const rows = (data ?? []) as Row[];
  if (!rows.length) return [];

  const { data: likeRows } = await supabase.from("post_likes").select("post_id").in("post_id", rows.map((r) => r.id));
  const likes = new Map<string, number>();
  for (const l of (likeRows ?? []) as { post_id: string }[]) likes.set(l.post_id, (likes.get(l.post_id) ?? 0) + 1);

  return rows
    .map((r) => {
      const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      return {
        id: r.id, author: p?.display_name ?? null, body: r.body ?? "", title: r.title,
        tickers: r.ticker_tags ?? [], kind: r.kind, at: r.created_at,
        pinned: !!r.pinned, likes: likes.get(r.id) ?? 0,
        activity: r.kind === "activity" ? activitySentence(r.activity_payload) : null,
      };
    })
    // A post with nothing to show is dropped rather than rendered as an empty row.
    .filter((p) => p.body || p.title || p.activity);
}

export type Standing = { userId: string; name: string; xp: number; rank: number; beltLevel: number };

/** This week's work, not all time — a leaderboard nobody new can ever enter is not a leaderboard. */
export async function loadStandings(weekStartISO: string, limit = 25): Promise<Standing[]> {
  const { data, error } = await supabase
    .from("xp_events").select("user_id, amount").gte("created_at", weekStartISO);
  if (error) throw error;

  const total = new Map<string, number>();
  for (const r of (data ?? []) as { user_id: string; amount: number }[]) {
    total.set(r.user_id, (total.get(r.user_id) ?? 0) + (r.amount ?? 0));
  }
  const top = [...total.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  if (!top.length) return [];

  const ids = top.map(([id]) => id);
  const [{ data: profiles }, { data: awards }] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", ids),
    supabase.from("fic_belt_awards").select("user_id, belt_level").in("user_id", ids),
  ]);
  const name = new Map(((profiles ?? []) as { id: string; display_name: string | null }[]).map((p) => [p.id, p.display_name]));
  const belt = new Map<string, number>();
  for (const a of (awards ?? []) as { user_id: string; belt_level: number }[]) {
    belt.set(a.user_id, Math.max(belt.get(a.user_id) ?? 1, a.belt_level));
  }

  return top.map(([userId, xp], i) => ({
    userId, xp, rank: i + 1, name: name.get(userId) ?? "Member", beltLevel: belt.get(userId) ?? 1,
  }));
}
