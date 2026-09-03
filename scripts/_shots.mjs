import fs from "node:fs";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
const env = Object.fromEntries(fs.readFileSync(".env.local","utf8").split("\n").filter(l=>l.includes("=")&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,"")];}));
const BASE = "https://family-investing-club.vercel.app";
const OUT = "proof/curriculum";
fs.mkdirSync(OUT, { recursive: true });
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });
const { data: link } = await admin.auth.admin.generateLink({ type:"magiclink", email:"kcoffie90@gmail.com" });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:402,height:874}, deviceScaleFactor:2 });
const p = await ctx.newPage();
await p.goto(`${BASE}/auth/callback?token_hash=${link.properties.hashed_token}&type=magiclink&next=/home`, { waitUntil:"domcontentloaded" });
await p.waitForLoadState("networkidle").catch(()=>{});
console.log("signed in →", new URL(p.url()).pathname);
const shots = [
  ["01-learn-shelf", "/learn/library"],
  ["02-trade-ready", "/learn/path/fta-trade-ready"],
  ["03-legacy-intro-markets", "/learn/path/tf-100"],
  ["04-legacy-chart-reading", "/learn/path/tf-101"],
  ["05-legacy-risk-mgmt", "/learn/path/tf-102"],
  ["06-legacy-day-trading", "/learn/path/dt-101"],
];
for (const [name, path] of shots) {
  const res = await p.goto(`${BASE}${path}`, { waitUntil:"domcontentloaded" });
  await p.waitForLoadState("networkidle").catch(()=>{});
  await p.waitForTimeout(2500);
  const txt = (await p.locator("body").innerText().catch(()=>"" )).trim();
  await p.screenshot({ path:`${OUT}/${name}.png`, fullPage:true });
  console.log(`${name.padEnd(28)} ${res?.status()} ${new URL(p.url()).pathname.padEnd(32)} ${txt.length} chars`);
}
await b.close();
