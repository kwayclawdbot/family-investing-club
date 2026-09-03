/**
 * Install an authored lesson JSON onto a `lessons.steps` column.
 *
 *   node scripts/install-lesson.mjs <course-slug> "<lesson title>" scripts/content/<file>.json
 *   node scripts/install-lesson.mjs <course-slug> "<lesson title>" --clear     # put it back
 *
 * Writes ONLY `lessons.steps` on the one matched row, and prints the row before and after so the
 * change is reversible by hand. A lesson with `steps` set renders through the stepped engine and
 * ignores `video_id` (DECISIONS #65) — clearing restores whatever the row had before.
 */
import fs from "node:fs";
import { execSync } from "node:child_process";

const REF = "zvkercqohmmeyofycbgr";
let tok = execSync('security find-generic-password -s "Supabase CLI" -w', { encoding: "utf8" }).trim();
if (tok.startsWith("go-keyring-base64:")) tok = Buffer.from(tok.slice("go-keyring-base64:".length), "base64").toString("utf8").trim();

async function sql(query, readOnly = false) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, ...(readOnly ? { read_only: true } : {}) }),
  });
  const body = await r.text();
  if (!r.ok) { console.error(r.status, body.slice(0, 500)); process.exit(1); }
  return JSON.parse(body);
}
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

const [slug, title, file] = process.argv.slice(2);
if (!slug || !title || !file) { console.error("usage: install-lesson <course-slug> <lesson title> <file.json|--clear>"); process.exit(2); }

const found = await sql(`
  select l.id, l.title, l.video_provider, (l.steps is not null) had_steps, c.slug, c.published
  from lessons l join modules m on m.id = l.module_id join courses c on c.id = m.course_id
  where c.slug = ${lit(slug)} and l.title = ${lit(title)}`, true);
if (found.length !== 1) { console.error(`expected exactly one lesson, matched ${found.length}`); process.exit(1); }
const row = found[0];
console.log("before:", JSON.stringify(row));

if (file === "--clear") {
  await sql(`update lessons set steps = null where id = ${lit(row.id)}`);
  console.log("cleared — the row falls back to its legacy viewer");
} else {
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  const steps = json.steps ?? json;
  if (!Array.isArray(steps) || !steps.length) { console.error("no steps in that file"); process.exit(1); }
  await sql(`update lessons set steps = ${lit(JSON.stringify(json))}::jsonb where id = ${lit(row.id)}`);
  console.log(`installed ${steps.length} sections:`, steps.map((s) => `${s.label ?? s.type}`).join(" · "));
}

const after = await sql(`select id, (steps is not null) has_steps, jsonb_array_length(steps->'steps') sections from lessons where id = ${lit(row.id)}`, true);
console.log("after :", JSON.stringify(after[0]));
console.log(`lesson url: /lesson/${row.id}`);
