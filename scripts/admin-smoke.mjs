/**
 * Admin smoke (Phase 7): sign in as the seeded admin with a magic link, then call every admin_* RPC
 * the (admin) pages render from and print row counts — proof the pages have real data. Read-only:
 * nothing here writes a row. `node scripts/admin-smoke.mjs`
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const EMAIL = process.env.SMOKE_EMAIL || "kcoffie90@gmail.com";

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email: EMAIL });
if (linkErr) { console.error("magic link failed:", linkErr.message); process.exit(1); }
const u = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { data: sess, error: sessErr } = await u.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
if (sessErr) { console.error("session failed:", sessErr.message); process.exit(1); }

const { data: me } = await u.from("profiles").select("id, role, display_name, family_id").eq("id", sess.user.id).maybeSingle();
console.log(`signed in as ${me?.display_name ?? EMAIL} · role=${me?.role} · ${sess.user.id.slice(0, 8)}`);
if (me?.role !== "admin") { console.error("NOT AN ADMIN — every admin_* RPC will refuse. Stopping."); process.exit(1); }

const size = (d) => (Array.isArray(d) ? `${d.length} rows` : d && typeof d === "object" ? `${Object.keys(d).length} keys` : String(d));
let fails = 0;
async function rpc(label, fn, args, peek) {
  const { data, error } = await u.rpc(fn, args);
  if (error) { fails++; console.log(`✗ ${label.padEnd(24)} ${fn} — ${error.code ?? ""} ${error.message}`); return null; }
  console.log(`✓ ${label.padEnd(24)} ${fn.padEnd(30)} ${size(data)}${peek ? ` · ${peek(data)}` : ""}`);
  return data;
}
async function table(label, q) {
  const { count, error } = await q;
  if (error) { fails++; console.log(`✗ ${label.padEnd(24)} — ${error.message}`); return; }
  console.log(`✓ ${label.padEnd(24)} ${String(count).padStart(5)} rows`);
}

console.log("\n— overview (/admin) —");
const o = await rpc("crm overview", "admin_crm_overview", {}, (d) => `${d.total_members} members · ${d.total_families} families · dau ${d.dau} wau ${d.wau} mau ${d.mau} · fta ${d.tier_fta} fic ${d.tier_fic} · newest ${d.newest_signups?.length} · active fams ${d.active_families?.length} · at risk ${d.at_risk?.length}`);
await rpc("daily activity", "admin_daily_activity", { p_days: 30 }, (d) => `${d.reduce((n, x) => n + x.signups, 0)} signups / ${d.reduce((n, x) => n + x.lessons_completed, 0)} lessons in 30d`);

console.log("\n— members (/admin/members) —");
const contacts = await rpc("contacts", "admin_contacts", { p_search: null, p_kind: "all", p_sort: "recent", p_limit: 2000, p_offset: 0 }, (d) => {
  const k = {}; for (const r of d) k[r.contact_kind] = (k[r.contact_kind] ?? 0) + 1;
  return Object.entries(k).map(([a, b]) => `${a}:${b}`).join(" ");
});
const members = await rpc("member activity", "admin_member_activity", {}, (d) => `${d.filter((m) => m.last_seen).length} have signed in`);
const someone = members?.find((m) => m.id !== sess.user.id) ?? members?.[0];
if (someone) {
  await rpc("member timeline", "admin_member_timeline", { p_user_id: someone.id, p_limit: 40 }, () => `for ${someone.display_name ?? someone.id.slice(0, 8)}`);
  await rpc("contact timeline", "admin_contact_timeline", { p_user_id: someone.id, p_email: null, p_limit: 40 });
  await rpc("contact support", "admin_contact_support", { p_user_id: someone.id, p_email: null });
  await table("admin_notes (their notes)", u.from("admin_notes").select("id", { count: "exact", head: true }).eq("user_id", someone.id));
}

console.log("\n— families (/admin/families) —");
const fam = someone?.family_id ?? me.family_id;
if (fam) await rpc("family detail", "admin_family_detail", { p_family_id: fam }, (d) => `${d.family?.name ?? "?"} · tier ${d.family?.tier} · ${d.members?.length} members · ${d.enrollments?.length} enrollments · ${d.watchlist?.length} watchlist`);
const fams = await admin.from("families").select("id", { count: "exact", head: true });
console.log(`✓ families (service role)    ${String(fams.count).padStart(5)} rows${fams.error ? " — " + fams.error.message : ""}`);

console.log("\n— marketing (/admin/leads · /pipeline · /campaigns · /drips) —");
const leads = await rpc("marketing leads", "admin_marketing_leads", {}, (d) => {
  const st = {}; for (const l of d) st[l.stage] = (st[l.stage] ?? 0) + 1;
  return Object.entries(st).map(([a, b]) => `${a}:${b}`).join(" ");
});
if (leads?.[0]) await rpc("lead detail", "admin_marketing_lead_detail", { p_lead_id: leads[0].id }, (d) => `${d.events?.length} events`);
await rpc("campaigns", "admin_marketing_campaigns", {}, (d) => d.map((c) => `${c.name}(${c.status})`).join(", ") || "none");
await table("email_drips", u.from("email_drips").select("id", { count: "exact", head: true }));

console.log("\n— funnel (/admin/funnel) —");
const to = new Date().toISOString(), from = new Date(Date.now() - 90 * 86400000).toISOString();
await rpc("funnel analytics", "admin_funnel_analytics", { p_funnel: "free_class", p_from: from, p_to: to }, (d) => `${d.totals?.sessions} sessions · ${d.totals?.email_captured} emails · ${d.totals?.registered} registered · ${d.steps?.length} steps`);
await rpc("partial leads", "admin_funnel_partial_leads", { p_funnel: "free_class", p_from: from, p_to: to });

console.log("\n— support (/admin/support) —");
const tickets = await rpc("help tickets", "admin_help_tickets", { p_status: "all", p_category: "all" }, (d) => `${d.filter((t) => t.awaiting_team).length} awaiting the team`);
if (tickets?.[0]) await rpc("ticket detail", "admin_help_ticket_detail", { p_ticket_id: tickets[0].id }, (d) => `${d.messages?.length} messages`);

console.log("\n— challenge (/admin/challenge) —");
await rpc("challenge cohort", "admin_challenge_cohort", {}, (d) => `${d.total} signed up · ${d.activated} activated · ${d.converted_paid} converted · ${d.members?.length} member rows`);

console.log("\n— announcements (/admin/announcements) —");
await rpc("announcement history", "admin_announcement_history", { p_limit: 30 });
await rpc("broadcast history", "admin_broadcast_history", { p_limit: 30 });
for (const a of ["all", "fic", "fta", "free"]) await rpc(`audience ${a}`, "notif_audience_count", { p_audience: a }, (d) => `${d?.recipients ?? 0} members · ${d?.push_subs ?? 0} with push`);

console.log("\n— content (/admin/courses · /courses/drafts · /live-sessions) —");
await table("courses", u.from("courses").select("id", { count: "exact", head: true }));
await table("modules", u.from("modules").select("id", { count: "exact", head: true }));
await table("lessons (live)", u.from("lessons").select("id", { count: "exact", head: true }).eq("retired", false));
await table("live_sessions", u.from("live_sessions").select("id", { count: "exact", head: true }));
await rpc("learn drafts", "list_learn_drafts", {}, (d) => `${d.filter((x) => x.has_draft && !x.in_sync).length} unpublished edits`);

console.log("\n— gate —");
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const denied = await anon.rpc("admin_crm_overview");
console.log(denied.error ? `✓ signed-out admin_crm_overview denied (${denied.error.code ?? denied.error.message})` : "✗ SIGNED-OUT CALL WAS ALLOWED");
if (!denied.error) fails++;

console.log(`\n${fails === 0 ? "all admin readers answered ✓" : `${fails} reader(s) failed ✗`} · contacts=${contacts?.length ?? 0} members=${members?.length ?? 0} overview=${o ? "ok" : "null"}`);
process.exit(fails === 0 ? 0 : 1);
