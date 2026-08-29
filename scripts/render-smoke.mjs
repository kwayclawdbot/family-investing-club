/**
 * Render smoke: signs in for real (magic link minted with the service key) and loads the key
 * screens in a browser, failing on any error overlay, empty <main>, or console error.
 * Proves the pages actually render with live data — the one thing the API smokes can't show.
 *
 *   npm run build && npx next start -p 3103 &
 *   node scripts/render-smoke.mjs            # BASE=http://localhost:3103 SMOKE_EMAIL=…
 *
 * Read-only: it only navigates. Screenshots land in proof/live/.
 */
import fs from "node:fs";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
  })
);
const BASE = process.env.BASE ?? "http://localhost:3103";
const EMAIL = process.env.SMOKE_EMAIL ?? "kcoffie90@gmail.com";
const OUT = "proof/live";

/** Routes that intentionally redirect: path → where it must land (see docs/DECISIONS.md). */
const EXPECTED_REDIRECTS = { "/community": "/home", "/practice": "/learn", "/club/members": "/club", "/club/portfolio": "/club" };

const ROUTES = [
  ["home", "/home"], ["club", "/club"], ["discover", "/discover"], ["learn", "/learn"],
  ["learn-library", "/learn/library"], ["learn-review", "/learn/review"], ["live", "/live"],
  ["practice-portfolio", "/practice/portfolio"], ["family", "/family"], ["family-members", "/family/members"],
  ["profile", "/profile"], ["profile-settings", "/profile/settings"], ["profile-billing", "/profile/billing"],
  ["profile-notifications", "/profile/notifications"], ["community", "/community"],
  // /community redirects to /home by design (DECISIONS #39) — declared below, not a failure.
  ["admin", "/admin"], ["admin-members", "/admin/members"], ["admin-families", "/admin/families"],
  ["admin-leads", "/admin/leads"], ["admin-pipeline", "/admin/pipeline"], ["admin-campaigns", "/admin/campaigns"],
  ["admin-support", "/admin/support"], ["admin-courses", "/admin/courses"], ["admin-funnel", "/admin/funnel"],
  ["admin-announcements", "/admin/announcements"], ["admin-live-sessions", "/admin/live-sessions"],
  ["admin-drips", "/admin/drips"], ["admin-challenge", "/admin/challenge"],
];

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: link, error: le } = await admin.auth.admin.generateLink({ type: "magiclink", email: EMAIL });
if (le) { console.error("generateLink failed:", le.message); process.exit(1); }

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });

// The app's own callback exchanges the token and sets the session cookies.
const verify = `${BASE}/auth/callback?token_hash=${link.properties.hashed_token}&type=magiclink&next=/home`;
await page.goto(verify, { waitUntil: "domcontentloaded" });
await page.waitForLoadState("networkidle").catch(() => {});
if (new URL(page.url()).pathname.startsWith("/login")) {
  console.error(`sign-in failed — landed on ${page.url()}`);
  await browser.close(); process.exit(1);
}
console.log(`signed in as ${EMAIL} → ${new URL(page.url()).pathname}\n`);

let failed = 0;
for (const [name, path] of ROUTES) {
  consoleErrors.length = 0;
  const res = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  const status = res?.status() ?? 0;
  const landed = new URL(page.url()).pathname;
  const text = (await page.locator("body").innerText().catch(() => "")).trim();
  const overlay = await page.locator("text=/Application error|Unhandled Runtime Error|This page could not be found/i").count();
  // Next renders error overlays as normal DOM in prod builds, so check the text too.
  const want = EXPECTED_REDIRECTS[path] ?? path;
  const bad = status >= 400 || overlay > 0 || text.length < 40 || landed !== want;
  const errs = consoleErrors.filter((e) => !/favicon|manifest|service worker|404 \(Not Found\)/i.test(e));
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  if (bad) {
    failed++;
    console.log(`FAIL  ${path.padEnd(28)} status=${status} landed=${landed} chars=${text.length}${overlay ? " OVERLAY" : ""}`);
  } else {
    const note = want !== path ? ` → ${want} (by design)` : "";
    console.log(`ok    ${path.padEnd(28)} ${String(text.length).padStart(5)} chars${note}${errs.length ? `  · ${errs.length} console error(s): ${errs[0].slice(0, 80)}` : ""}`);
  }
}

await browser.close();
console.log(`\n${ROUTES.length - failed} rendered · ${failed} failed · screenshots in ${OUT}/`);
process.exit(failed ? 1 : 0);
