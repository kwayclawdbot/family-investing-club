/** Identity smoke (Phase 1): session fields + fic_ensure_family_club idempotency as the seeded user. Read-mostly (the RPC is idempotent). `node scripts/identity-smoke.mjs` */
import fs from "node:fs"; import { createClient } from "@supabase/supabase-js";
const env = Object.fromEntries(fs.readFileSync(".env.local","utf8").split("\n").filter(l=>l.includes("=")&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(), l.slice(i+1).trim()];}));
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email: "kcoffie90@gmail.com" });
const u = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { data: s } = await u.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
console.log("user", s.user.id.slice(0,8));
const prof = await u.from("profiles").select("role, family_id, onboarding_complete, age_group, comprehension_level").eq("id", s.user.id).maybeSingle(); console.log("profile", JSON.stringify(prof.data), prof.error?.message ?? "");
const tier = await u.from("family_tiers").select("tier, club_lapsed").eq("family_id", prof.data.family_id).maybeSingle(); console.log("family_tiers", JSON.stringify(tier.data), tier.error?.message ?? "");
const fam = await u.from("families").select("id, name, plan_tier, door").eq("id", prof.data.family_id).maybeSingle(); console.log("family", JSON.stringify(fam.data), fam.error?.message ?? "");
const c1 = await u.rpc("fic_ensure_family_club", { p_name: null, p_kind: "family", p_privacy: "private" }); console.log("ensure#1", c1.data?.name, c1.data?.invite_code, c1.error?.message ?? "");
const c2 = await u.rpc("fic_ensure_family_club", { p_name: "Should Not Create", p_kind: "family", p_privacy: "private" }); console.log("ensure#2 (idempotent)", c2.data?.id === c1.data?.id ? "same club ✓" : "DUPLICATE ✗", c2.error?.message ?? "");
const m = await u.from("fic_club_members").select("user_id, role").eq("club_id", c1.data.id); console.log("members", m.data?.length, JSON.stringify(m.data?.map(x=>x.role)));
const xp = await u.from("xp_events").select("user_id", { count: "exact", head: true }); console.log("xp_events visible", xp.count);
const bf = await u.rpc("fic_backfill_family_clubs"); console.log("backfill as user (expect denied):", bf.error ? "denied ✓ " + bf.error.code : "ALLOWED ✗");
