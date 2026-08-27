/**
 * Visual proof: shoots every screen at 390×844 into proof/.
 *   npm run dev -- -p 3100   (in another shell)
 *   node scripts/proof.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE = process.env.PROOF_BASE ?? "http://localhost:3100";
const OUT = path.resolve("proof");
const ROUTES = [
  ["welcome", "/welcome"],
  ["onb-1-who", "/onboarding/who"],
  ["onb-2-start", "/onboarding/start"],
  ["onb-3-goals", "/onboarding/goals"],
  ["onb-4-daily", "/onboarding/daily"],
  ["onb-5-ready", "/onboarding/ready"],
  ["home", "/home"],
  ["learn", "/learn"],
  ["learn-library", "/learn/library"],
  ["learn-path", "/learn/path/stock-market-101"],
  ["lesson", "/lesson/if-7"],
  ["markets", "/markets"],
  ["markets-aapl", "/markets/AAPL"],
  ["practice", "/practice"],
  ["kai", "/kai"],
  ["club", "/club"],
  ["club-idea", "/club/idea/nuclear-next-decade"],
  ["family", "/family"],
  ["profile", "/profile"],
  ["login", "/login"],
  // round 2
  ["signup", "/signup"],
  ["forgot", "/forgot-password"],
  ["live", "/live"],
  ["live-session", "/live/market-open-talk"],
  ["recording", "/live/rec-diversification"],
  ["review", "/learn/review"],
  ["games", "/learn/games"],
  ["game-term-match", "/learn/games/term-match"],
  ["chart-practice", "/learn/chart-practice"],
  ["scenarios", "/learn/scenarios"],
  ["scenario", "/learn/scenarios/first-drawdown"],
  ["watchlist", "/markets/watchlist"],
  ["news", "/markets/news"],
  ["news-item", "/markets/news/n1"],
  ["discover", "/markets/discover"],
  ["search", "/search"],
  ["trade", "/practice/trade/AAPL"],
  ["club-new", "/club/new"],
  ["club-discuss", "/club/idea/nuclear-next-decade/discuss"],
  ["club-portfolio", "/club/portfolio/fic-growth"],
  ["club-groups", "/club/groups"],
  ["club-group", "/club/groups/beginners-circle"],
  ["club-challenges", "/club/challenges"],
  ["club-challenge", "/club/challenges/family-brand-research"],
  ["club-member", "/club/members/sarah-j"],
  ["family-members", "/family/members"],
  ["family-member", "/family/members/arielle"],
  ["family-invite", "/family/invite"],
  ["family-challenge", "/family/challenge"],
  ["family-research", "/family/research"],
  ["settings", "/profile/settings"],
  ["notifications", "/profile/notifications"],
  ["billing", "/profile/billing"],
  ["referrals", "/profile/referrals"],
  ["help", "/profile/help"],
  ["badges", "/profile/badges"],
  ["progress", "/profile/progress"],
];

await fs.mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(`${page.url()}: ${m.text()}`); });
for (const [name, route] of ROUTES) {
  const res = await page.goto(BASE + route, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log(`${res?.status()}  ${route}  → proof/${name}.png`);
}
await browser.close();
if (errors.length) { console.log("\nConsole/page errors:"); for (const e of errors) console.log(" -", e); process.exitCode = 1; }
