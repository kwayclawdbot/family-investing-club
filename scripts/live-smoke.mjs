/**
 * Live-data smoke: exercises every Supabase reader against the FTA project as the seeded user
 * (kcoffie90@gmail.com) using a magic-link session minted with the service key, and reports
 * live / null / table-missing per reader. Read-only.
 *   node scripts/live-smoke.mjs
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const URL = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.SMOKE_EMAIL ?? "kcoffie90@gmail.com";

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const { data: link, error: le } = await admin.auth.admin.generateLink({ type: "magiclink", email: EMAIL });
if (le) { console.error("generateLink failed:", le.message); process.exit(1); }
const user = createClient(URL, ANON, { auth: { persistSession: false } });
const { data: sess, error: ve } = await user.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
if (ve || !sess.session) { console.error("verifyOtp failed:", ve?.message); process.exit(1); }
console.log(`signed in as ${EMAIL} (${sess.user.id.slice(0, 8)})\n`);

const missing = (e) => e && (e.code === "42P01" || e.code === "PGRST205" || e.code === "PGRST202" || /does not exist|could not find/i.test(e.message ?? ""));
const uid = sess.user.id;
const checks = [
  ["profiles (identity)", () => user.from("profiles").select("id, display_name, family_id").eq("id", uid).maybeSingle()],
  ["xp_events (belt/XP)", () => user.from("xp_events").select("amount").eq("user_id", uid).limit(500)],
  ["user_badges", () => user.from("user_badges").select("badge_id").eq("user_id", uid)],
  ["skill_mastery", () => user.from("skill_mastery").select("skill_id").eq("user_id", uid)],
  ["ticker_stances (personal list)", () => user.from("ticker_stances").select("ticker").eq("user_id", uid)],
  ["family_watchlist (club list)", () => user.from("family_watchlist").select("ticker").limit(5)],
  ["sim_portfolios (practice)", () => user.from("sim_portfolios").select("id").eq("user_id", uid).maybeSingle()],
  ["sim_trades (orders)", () => user.from("sim_trades").select("id").limit(5)],
  ["courses/modules/lessons (paths)", () => user.from("courses").select("id").eq("published", true).limit(5)],
  ["lesson_progress", () => user.from("lesson_progress").select("id").eq("user_id", uid).limit(5)],
  ["flashcards", () => user.from("flashcards").select("id").limit(5)],
  ["live_sessions", () => user.from("live_sessions").select("id").limit(5)],
  ["news_articles", () => user.from("news_articles").select("id").eq("published", true).limit(5)],
  ["feed_posts (community)", () => user.from("feed_posts").select("id").limit(5)],
  ["chat_room_members (chats)", () => user.from("chat_room_members").select("room_id").eq("user_id", uid)],
  ["notifications", () => user.from("notifications").select("id").eq("user_id", uid).limit(5)],
  ["fic_clubs (migration)", () => user.from("fic_clubs").select("id").limit(1)],
  ["fic_club_members", () => user.from("fic_club_members").select("club_id").eq("user_id", uid)],
  ["fic_club_picks", () => user.from("fic_club_picks").select("id").limit(1)],
  ["fic_club_proposals", () => user.from("fic_club_proposals").select("id").limit(1)],
  ["fic_club_holdings", () => user.from("fic_club_holdings").select("symbol").limit(1)],
  ["fic_club_research", () => user.from("fic_club_research").select("id").limit(1)],
  ["fic_club_activity (view)", () => user.from("fic_club_activity").select("kind").limit(1)],
  ["fic_brokerage_links", () => user.from("fic_brokerage_links").select("user_id").eq("user_id", uid)],
  ["rpc fic_is_club_member", () => user.rpc("fic_is_club_member", { p_club: "00000000-0000-0000-0000-000000000000" })],
];
let live = 0, empty = 0, miss = 0, err = 0;
for (const [label, fn] of checks) {
  const { data, error } = await fn();
  let state;
  if (error) { if (missing(error)) { state = "TABLE MISSING (awaits migration)"; miss++; } else { state = `ERROR ${error.code ?? ""} ${error.message}`; err++; } }
  else { const n = Array.isArray(data) ? data.length : data ? 1 : 0; state = n ? `live · ${n} row${n === 1 ? "" : "s"}` : "live · 0 rows (fixture fallback)"; if (n) live++; else empty++; }
  console.log(`${label.padEnd(34)} ${state}`);
}
console.log(`\n${live} live · ${empty} empty · ${miss} awaiting migration · ${err} errors`);
await user.auth.signOut();
