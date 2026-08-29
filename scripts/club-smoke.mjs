/**
 * Lane CLUB smoke — exercises `src/lib/live/{club,community,notifications}.ts` and
 * `src/app/api/{club,community,notifications}/**` against the live FTA project AS the seeded member
 * (magic-link session, same pattern as scripts/identity-smoke.mjs), so RLS is really tested.
 *
 * Includes the RLS gaps closed by `supabase/migrations/20260829010000_fic_club_rls_gaps.sql`:
 * an author may now edit/withdraw their own ask and pick reply, and `fic_club_research` UPDATE is
 * limited to the assignee, the club founder/admin or a site admin — the negative half of that is
 * proved with a second session as an ordinary club member.
 *
 * Every write is to a row this script creates, or is put back to the value captured before the run.
 *
 *   node scripts/club-smoke.mjs
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

/* ── sessions ──────────────────────────────────────────────────────── */
const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.SMOKE_EMAIL ?? "kcoffie90@gmail.com";
const startedAt = new Date().toISOString();

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
async function signIn(email) {
  const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) return { error };
  const c = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { data, error: ve } = await c.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (ve || !data?.session) return { error: ve ?? new Error("no session") };
  return { client: c, userId: data.user.id };
}
const first = await signIn(EMAIL);
if (first.error) { console.error("sign-in failed:", first.error.message); process.exit(1); }
const u = first.client, uid = first.userId;
const { data: me } = await u.from("profiles").select("id, role, age_group, display_name, family_id").eq("id", uid).maybeSingle();
console.log(`CLUB smoke — ${EMAIL} (${uid.slice(0, 8)}) role=${me?.role}\n`);

/* ── harness ───────────────────────────────────────────────────────── */
let pass = 0, fail = 0;
const cleanups = [], leftBehind = [];
async function check(name, fn) {
  try { const note = await fn(); pass++; console.log(`PASS  ${name}${note ? ` — ${note}` : ""}`); }
  catch (e) { fail++; console.log(`FAIL  ${name} — ${e?.message ?? e}`); }
}
const ensure = (c, m) => { if (!c) throw new Error(m); };
const err = (res, what) => { if (res.error) throw new Error(`${what}: ${res.error.code ?? ""} ${res.error.message}`); return res.data; };

/* ── 1. club context + picks + proposals + holdings ────────────────── */
let ctx = null, pick = null;
await check("club context + members + profiles load (club.clubContext)", async () => {
  const mine = err(await u.from("fic_club_members").select("club_id").eq("user_id", uid).order("joined_at").limit(1), "fic_club_members");
  ensure(mine.length, "this member is in no club — fic_ensure_family_club has not run for them");
  const clubId = mine[0].club_id;
  const club = err(await u.from("fic_clubs").select("*").eq("id", clubId).single(), "fic_clubs");
  const members = err(await u.from("fic_club_members").select("*").eq("club_id", clubId), "members");
  const profs = err(await u.from("profiles").select("id, family_id, role, display_name, email, age_group, comprehension_level, onboarding_complete, username").in("id", members.map((m) => m.user_id)), "member profiles");
  ensure(profs.length === members.length, `only ${profs.length}/${members.length} club-mate profiles resolve under RLS — names would render as "Member"`);
  const mine2 = members.find((m) => m.user_id === uid);
  ctx = { club, members, me: uid, myRole: mine2?.role };
  return `"${club.name}" ${club.kind}/${club.privacy} · ${members.length} members · my role ${mine2?.role} · vote_gated ${members.filter((m) => m.vote_gated).length}`;
});

await check("picks + replies + reactions load (club.getPicks)", async () => {
  ensure(ctx, "no club context");
  const rows = err(await u.from("fic_club_picks").select("*").eq("club_id", ctx.club.id).order("created_at", { ascending: false }).limit(50), "fic_club_picks");
  ensure(rows.length, "no picks in this club");
  pick = rows[0];
  const ids = rows.map((r) => r.id);
  const replies = err(await u.from("fic_club_pick_replies").select("*").in("pick_id", ids).order("created_at"), "fic_club_pick_replies");
  const reactions = err(await u.from("fic_club_pick_reactions").select("*").in("pick_id", ids), "fic_club_pick_reactions");
  return `${rows.length} picks · ${replies.length} replies · ${reactions.length} reactions · latest ${pick.symbol} (${pick.stance})`;
});

await check("proposals + votes + holdings + research + activity load", async () => {
  ensure(ctx, "no club context");
  const props = err(await u.from("fic_club_proposals").select("*").eq("club_id", ctx.club.id).order("created_at", { ascending: false }), "fic_club_proposals");
  if (props.length) err(await u.from("fic_club_votes").select("*").in("proposal_id", props.map((p) => p.id)), "fic_club_votes");
  const holds = err(await u.from("fic_club_holdings").select("*").eq("club_id", ctx.club.id).order("weight_pct", { ascending: false }), "fic_club_holdings");
  ensure(holds.length, "no holdings — the club portfolio reader returns null and the page shows an empty state");
  err(await u.from("fic_club_decisions").select("*").eq("club_id", ctx.club.id).order("decided_on", { ascending: false }), "fic_club_decisions");
  const research = err(await u.from("fic_club_research").select("*").eq("club_id", ctx.club.id).order("created_at", { ascending: false }), "fic_club_research");
  const activity = err(await u.from("fic_club_activity").select("*").eq("club_id", ctx.club.id).order("created_at", { ascending: false }).limit(12), "fic_club_activity (view)");
  err(await u.from("fic_brokerage_links").select("user_id, synced_at").in("user_id", ctx.members.map((m) => m.user_id)), "fic_brokerage_links");
  return `${props.length} proposals · ${holds.length} holdings (${holds.reduce((a, h) => a + Number(h.weight_pct), 0).toFixed(0)}% weighted) · ${research.length} research · ${activity.length} activity rows`;
});

/* ── 2. ask: create → (RLS gap) update → delete ────────────────────── */
await check("WRITE ask created, edited and withdrawn (POST/DELETE /api/club/ask + new RLS)", async () => {
  ensure(ctx, "no club context");
  const q = "Smoke check: what would make us sell this position?";
  const row = err(await u.from("fic_club_asks").insert({ club_id: ctx.club.id, author_id: uid, question: q, symbol: null }).select("id, question").single(), "insert ask");
  cleanups.push(["fic_club_asks (test ask)", async () => u.from("fic_club_asks").delete().eq("id", row.id)]);
  const back = err(await u.from("fic_club_asks").select("id, club_id, author_id, question").eq("id", row.id).maybeSingle(), "read ask");
  ensure(back && back.question === q, `read back ${JSON.stringify(back)}`);
  // 20260829010000: "asks: author updates"
  const edited = err(await u.from("fic_club_asks").update({ question: `${q} (edited)` }).eq("id", row.id).eq("author_id", uid).select("id, question"), "update ask");
  ensure(edited.length === 1 && edited[0].question.endsWith("(edited)"), "the author could not UPDATE their own ask — RLS gap migration not in force");
  // 20260829010000: "asks: author deletes"
  const del = err(await u.from("fic_club_asks").delete().eq("id", row.id).eq("author_id", uid).select("id"), "delete ask");
  ensure(del.length === 1, "the author could not DELETE their own ask — /api/club/ask DELETE would answer 404");
  ensure(!err(await u.from("fic_club_asks").select("id").eq("id", row.id).maybeSingle(), "confirm ask gone"), "ask still present");
  return `created ${row.id.slice(0, 8)} → author UPDATE ok → author DELETE ok`;
});

/* ── 3. pick reaction: react then un-react ─────────────────────────── */
await check("WRITE pick reaction then un-react (POST /api/club/pick/react)", async () => {
  ensure(pick, "no pick to react to");
  const prior = err(await u.from("fic_club_pick_reactions").select("pick_id, user_id, kind").eq("pick_id", pick.id).eq("user_id", uid).maybeSingle(), "read prior reaction");
  err(await u.from("fic_club_pick_reactions").upsert({ pick_id: pick.id, user_id: uid, kind: "agree" }, { onConflict: "pick_id,user_id" }), "upsert reaction");
  cleanups.push(["fic_club_pick_reactions", async () => (prior
    ? u.from("fic_club_pick_reactions").upsert(prior, { onConflict: "pick_id,user_id" })
    : u.from("fic_club_pick_reactions").delete().eq("pick_id", pick.id).eq("user_id", uid))]);
  let back = err(await u.from("fic_club_pick_reactions").select("kind").eq("pick_id", pick.id).eq("user_id", uid).maybeSingle(), "read reaction");
  ensure(back?.kind === "agree", `read back ${JSON.stringify(back)}`);
  // switching stance must overwrite, not duplicate (PK pick_id,user_id)
  err(await u.from("fic_club_pick_reactions").upsert({ pick_id: pick.id, user_id: uid, kind: "not_sure" }, { onConflict: "pick_id,user_id" }), "switch reaction");
  const all = err(await u.from("fic_club_pick_reactions").select("kind").eq("pick_id", pick.id).eq("user_id", uid), "count reactions");
  ensure(all.length === 1 && all[0].kind === "not_sure", `switching stance produced ${all.length} rows`);
  // un-react
  err(await u.from("fic_club_pick_reactions").delete().eq("pick_id", pick.id).eq("user_id", uid), "un-react");
  ensure(!err(await u.from("fic_club_pick_reactions").select("kind").eq("pick_id", pick.id).eq("user_id", uid).maybeSingle(), "confirm un-react"), "reaction survived the delete");
  return `${pick.symbol}: agree → not_sure (one row) → un-reacted${prior ? " · prior reaction restored" : ""}`;
});

/* ── 4. pick reply: create → update → delete (the other RLS gap) ───── */
await check("WRITE pick reply created, edited and deleted (POST/DELETE /api/club/pick/reply + new RLS)", async () => {
  ensure(pick, "no pick to reply to");
  const row = err(await u.from("fic_club_pick_replies").insert({ pick_id: pick.id, author_id: uid, body: "Smoke reply — safe to ignore." }).select("id, body").single(), "insert reply");
  cleanups.push(["fic_club_pick_replies (test reply)", async () => u.from("fic_club_pick_replies").delete().eq("id", row.id)]);
  const edited = err(await u.from("fic_club_pick_replies").update({ body: "Smoke reply — edited." }).eq("id", row.id).eq("author_id", uid).select("id, body"), "update reply");
  ensure(edited.length === 1, "the author could not UPDATE their own reply — RLS gap migration not in force");
  const del = err(await u.from("fic_club_pick_replies").delete().eq("id", row.id).eq("author_id", uid).select("id"), "delete reply");
  ensure(del.length === 1, "the author could not DELETE their own reply — /api/club/pick/reply DELETE would answer 404");
  return `created ${row.id.slice(0, 8)} → author UPDATE ok → author DELETE ok`;
});

/* ── 5. community post → like → comment → delete ───────────────────── */
await check("WRITE community post + like + comment, then deleted (POST /api/community/post…)", async () => {
  const post = err(await u.from("feed_posts").insert({
    author_id: uid, family_id: me?.family_id ?? null, kind: "post", body: "Smoke post — created and removed by scripts/club-smoke.mjs.",
    title: null, ticker_tags: ["AAPL"], position: "neutral", activity_payload: null,
  }).select("id, body, ticker_tags, author_register, created_at").single(), "insert feed_post");
  cleanups.push(["feed_posts (test post)", async () => u.from("feed_posts").delete().eq("id", post.id).eq("author_id", uid)]);
  ensure(post.author_register, "feed_posts.author_register was not defaulted — the read policy would hide the post");

  // the reader must see it back with the exact column list community.getFeed uses
  const feed = err(await u.from("feed_posts").select("id, author_id, body, title, ticker_tags, position, activity_payload, created_at, author_register").eq("kind", "post").order("created_at", { ascending: false }).limit(30), "getFeed columns");
  ensure(feed.some((f) => f.id === post.id), "the new post is not visible to its own author through the feed reader");

  // like → unlike
  const like = err(await u.from("post_likes").insert({ post_id: post.id, user_id: uid }).select("id").single(), "insert like");
  cleanups.push(["post_likes (test like)", async () => u.from("post_likes").delete().eq("id", like.id)]);
  let likes = err(await u.from("post_likes").select("post_id, user_id").eq("post_id", post.id), "read likes");
  ensure(likes.length === 1 && likes[0].user_id === uid, `likes read back ${JSON.stringify(likes)}`);
  const dupe = await u.from("post_likes").insert({ post_id: post.id, user_id: uid });
  ensure(dupe.error?.code === "23505", "post_likes accepted a duplicate like (unique post_id,user_id missing)");

  // comment
  const comment = err(await u.from("post_comments").insert({ post_id: post.id, author_id: uid, body: "Smoke comment." }).select("id, body, author_register").single(), "insert comment");
  cleanups.push(["post_comments (test comment)", async () => u.from("post_comments").delete().eq("id", comment.id).eq("author_id", uid)]);
  const cs = err(await u.from("post_comments").select("id, author_id, body, created_at").eq("post_id", post.id).order("created_at"), "read comments (getFeedComments columns)");
  ensure(cs.length === 1 && cs[0].body === "Smoke comment.", `comments read back ${JSON.stringify(cs)}`);
  cleanups.push(["notifications raised by the test comment", async () => admin.from("notifications").delete().eq("actor_id", uid).eq("type", "reply").gte("created_at", startedAt)]);

  // delete comment, unlike, delete post — the app's own DELETE paths
  ensure(err(await u.from("post_comments").delete().eq("id", comment.id).eq("author_id", uid).select("id"), "delete comment").length === 1, "author could not delete their comment");
  err(await u.from("post_likes").delete().eq("post_id", post.id).eq("user_id", uid), "unlike");
  likes = err(await u.from("post_likes").select("post_id").eq("post_id", post.id), "read likes after unlike");
  ensure(likes.length === 0, "unlike left the like behind");
  ensure(err(await u.from("feed_posts").delete().eq("id", post.id).eq("author_id", uid).select("id"), "delete post").length === 1, "author could not delete their post");
  ensure(!err(await u.from("feed_posts").select("id").eq("id", post.id).maybeSingle(), "confirm post gone"), "post survived the delete");
  return `post ${post.id.slice(0, 8)} · like (dupe refused 23505) · comment · all three removed`;
});

/* ── 6. circles + rooms (community readers) ────────────────────────── */
await check("circles + community rooms load (community.getCircles / getRoom)", async () => {
  const open = err(await u.from("club_circles").select("*").gt("expires_at", new Date().toISOString()).order("expires_at", { ascending: true }).limit(24), "club_circles open");
  const all = err(await u.from("club_circles").select("*").order("expires_at", { ascending: true }).limit(24), "club_circles all");
  const counts = await u.rpc("club_circle_counts");
  if (counts.error) throw new Error(`rpc club_circle_counts: ${counts.error.code ?? ""} ${counts.error.message}`);
  err(await u.from("club_circle_members").select("circle_id").eq("member_id", uid), "club_circle_members");
  if (all.length) err(await u.from("club_circle_notes").select("id, author_id, body, stance, created_at").eq("circle_id", all[0].id).order("created_at").limit(120), "club_circle_notes");
  const rooms = err(await u.from("chat_rooms").select("id, type, name").order("created_at"), "chat_rooms");
  if (rooms.length) err(await u.from("chat_messages").select("room_id, user_id, content, created_at").in("room_id", rooms.map((r) => r.id)).order("created_at", { ascending: false }).limit(300), "chat_messages");
  return `${open.length} open circles (${all.length} total, ${counts.data?.length ?? 0} counted) · ${rooms.length} chat rooms`;
});

/* ── 7. notifications: read + ack + restore ────────────────────────── */
await check("notifications read, one acked, state restored (GET + POST /api/notifications/ack)", async () => {
  const rows = err(await u.from("notifications").select("id, type, body, link, ref_id, actor_id, read_at, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(40), "notifications");
  ensure(rows.length, "no notifications for this member");
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))];
  if (actorIds.length) err(await u.from("profiles").select("id, display_name, email").in("id", actorIds), "notification actor profiles");
  const { count: unread, error: ce } = await u.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", uid).is("read_at", null);
  if (ce) throw new Error(`unread count: ${ce.message}`);
  const target = rows.find((r) => !r.read_at);
  ensure(target, "every notification is already read — nothing safe to ack");
  const acked = err(await u.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", uid).is("read_at", null).eq("id", target.id).select("id"), "ack");
  cleanups.push(["notifications.read_at (single ack)", async () => u.from("notifications").update({ read_at: null }).eq("id", target.id).eq("user_id", uid)]);
  ensure(acked.length === 1, `ack matched ${acked.length} rows — members do not hold UPDATE on read_at`);
  const back = err(await u.from("notifications").select("read_at").eq("id", target.id).maybeSingle(), "read back ack");
  ensure(back.read_at, "read_at did not stick");
  const { count: after } = await u.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", uid).is("read_at", null);
  ensure(after === unread - 1, `unread went ${unread} → ${after}, expected ${unread - 1}`);
  // a member must not be able to ack somebody else's notification
  const foreign = await admin.from("notifications").select("id, user_id").neq("user_id", uid).is("read_at", null).limit(1).maybeSingle();
  let foreignNote = "no other unread notification to probe";
  if (foreign.data) {
    const bad = await u.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", foreign.data.id).select("id");
    ensure(!bad.data?.length, "a member acked another member's notification — RLS hole");
    foreignNote = "cross-member ack refused";
  }
  return `${rows.length} read · unread ${unread} → ${after} (restored) · ${foreignNote}`;
});

/* ── 8. fic_club_research UPDATE is limited to assignee/founder/admin ─ */
await check("research UPDATE allowed for the assignee/founder, refused for an ordinary member", async () => {
  ensure(ctx, "no club context");
  const rows = err(await u.from("fic_club_research").select("id, symbol, assignee_id, status, notes").eq("club_id", ctx.club.id), "fic_club_research");
  ensure(rows.length, "no research rows in this club");
  const canManage = await u.rpc("fic_can_manage_club", { p_club: ctx.club.id });
  if (canManage.error) throw new Error(`rpc fic_can_manage_club: ${canManage.error.code ?? ""} ${canManage.error.message}`);

  // positive: I am the founder — an UPDATE must land, and the prior value goes back
  const target = rows.find((r) => r.assignee_id === uid) ?? rows[0];
  const priorNotes = target.notes;
  const upd = err(await u.from("fic_club_research").update({ notes: "smoke note" }).eq("id", target.id).eq("club_id", ctx.club.id).select("id, notes"), "update research");
  cleanups.push(["fic_club_research.notes", async () => u.from("fic_club_research").update({ notes: priorNotes }).eq("id", target.id)]);
  ensure(upd.length === 1, `founder/assignee UPDATE matched ${upd.length} rows — the new policy is too tight`);

  // negative: a plain club member who is neither assignee nor founder/admin must match zero rows
  const others = ctx.members.filter((m) => m.user_id !== uid && m.role !== "founder" && m.role !== "admin");
  let negative = "no ordinary member in this club to probe with";
  let other = { error: new Error("nobody to try") }, prof = null;
  const tried = [];
  for (const m of others) {
    const { data: p } = await admin.from("profiles").select("id, email, role").eq("id", m.user_id).maybeSingle();
    if (!p?.email) continue;
    const attempt = await signIn(p.email);
    if (!attempt.error) { other = attempt; prof = p; break; }
    tried.push(`${p.email}: ${attempt.error.message}`);
  }
  if (others.length) {
    if (other.error) { negative = `could not sign in as any ordinary member — ${tried.join("; ")}`; }
    else {
      const foreign = rows.find((r) => r.assignee_id && r.assignee_id !== other.userId) ?? target;
      const beforeVal = (await admin.from("fic_club_research").select("notes, status").eq("id", foreign.id).single()).data;
      const denied = await other.client.from("fic_club_research").update({ notes: "should never land", status: "done" }).eq("id", foreign.id).select("id");
      const afterVal = (await admin.from("fic_club_research").select("notes, status").eq("id", foreign.id).single()).data;
      ensure(!denied.data?.length, `an ordinary member updated research assigned to someone else (${denied.data?.length} rows)`);
      ensure(afterVal.notes === beforeVal.notes && afterVal.status === beforeVal.status, "the row changed despite the policy matching zero rows");
      // the "claim unassigned" policy: a member may take an unassigned row
      const claimable = await admin.from("fic_club_research").insert({ club_id: ctx.club.id, symbol: "SMOK", company_name: "Smoke Research", assignee_id: null, reason: "created by club-smoke.mjs" }).select("id").single();
      if (claimable.data) {
        cleanups.push(["fic_club_research (test row, service role — no member DELETE policy)", async () => admin.from("fic_club_research").delete().eq("id", claimable.data.id)]);
        // the claim policy's WITH CHECK: a member may only claim an unassigned row FOR THEMSELVES
        const forOther = await other.client.from("fic_club_research").update({ assignee_id: uid }).eq("id", claimable.data.id).select("id");
        ensure(!forOther.data?.length, "a member assigned an unassigned research row to somebody else");
        const claimed = await other.client.from("fic_club_research").update({ assignee_id: other.userId }).eq("id", claimable.data.id).select("id");
        ensure(claimed.data?.length === 1, `an unassigned research row could not be claimed by a member (${claimed.error?.message ?? "0 rows"})`);
        // once claimed the member IS the assignee, so further edits are theirs by design (migration intent)
        const own = await other.client.from("fic_club_research").update({ status: "ready" }).eq("id", claimable.data.id).select("id");
        ensure(own.data?.length === 1, "the assignee could not update the row they had just claimed");
      }
      await other.client.auth.signOut();
      negative = `${prof.email} (club role ${others.find((m) => m.user_id === other.userId)?.role}) refused on another\u2019s row · claim-for-someone-else refused · self-claim then own edit allowed${tried.length ? ` · could not sign in: ${tried.join("; ")}` : ""}`;
    }
  }
  return `fic_can_manage_club(founder) = ${canManage.data} · UPDATE as founder ok (restored) · ${negative}`;
});

/* ── cleanup ───────────────────────────────────────────────────────── */
console.log("\ncleanup");
for (const [label, fn] of cleanups.reverse()) {
  const res = await fn();
  if (res?.error) { leftBehind.push(`${label}: ${res.error.message}`); console.log(`  LEFT  ${label} — ${res.error.message}`); }
  else console.log(`  ok    ${label} restored`);
}

console.log(`\n${pass} passed · ${fail} failed`);
if (leftBehind.length) console.log(`left behind: ${leftBehind.join(" | ")}`);
await u.auth.signOut();
process.exit(fail || leftBehind.length ? 1 : 0);
