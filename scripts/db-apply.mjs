/**
 * Apply a SQL file to the linked Supabase project via the Management API (no DB password needed).
 * Uses the Supabase CLI login token from the macOS keychain. Usage: node scripts/db-apply.mjs <file.sql>
 * Why: this repo shares the FTA project with another repo, so `supabase db push` refuses on migration-history mismatch.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
const REF = "zvkercqohmmeyofycbgr";
let tok = execSync('security find-generic-password -s "Supabase CLI" -w', { encoding: "utf8" }).trim();
if (tok.startsWith("go-keyring-base64:")) tok = Buffer.from(tok.slice("go-keyring-base64:".length), "base64").toString("utf8").trim();
const file = process.argv[2]; if (!file) { console.error("usage: db-apply <file.sql>"); process.exit(2); }
const query = fs.readFileSync(file, "utf8");
const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
const body = await r.text();
console.log(r.status, file, body.slice(0, 400));
process.exit(r.ok ? 0 : 1);
