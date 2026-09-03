/**
 * Install a batch of authored lessons.
 *
 *   node scripts/install-lessons.mjs scripts/content/belt-black-w1.json
 *   node scripts/install-lessons.mjs scripts/content/belt-black-w1.json --clear
 *
 * File shape: { lessons: [ { match: { course, title }, json: <LessonJSON> }, … ] }
 *
 * Writes ONLY `lessons.steps`, one row per entry, and refuses the whole batch if any entry does not
 * match exactly one lesson — a half-applied batch is worse than none. Prints a section plan per
 * lesson so the shape is visible without opening the app.
 */
import fs from "node:fs";
import { execSync } from "node:child_process";
import { validateChartFigure } from "../src/lib/learn/schema.ts";

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
  if (!r.ok) { console.error(r.status, body.slice(0, 600)); process.exit(1); }
  return JSON.parse(body);
}
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

const file = process.argv[2];
const clear = process.argv.includes("--clear");
if (!file) { console.error("usage: install-lessons <file.json> [--clear]"); process.exit(2); }
const batch = JSON.parse(fs.readFileSync(file, "utf8")).lessons;

/* Every chart figure is checked BEFORE anything is resolved or written.
   This is the gate that stops the defect that produced this file's rewrite: a section
   about a three-candle gap being handed one candle, a span naming a single bar, a swing
   marked at a price its candle never traded, or a marked object so small in the frame it
   reads as a sliver at 402px. A bad figure does not render badly — it does not install. */
{
  const problems = [];
  for (const entry of batch) {
    for (const step of entry.json.steps ?? []) {
      // A ChartFigure lives in exactly two places: `figure` on a `chart` step, and `chart` on a
      // `prediction` step. An `explainer` ALSO has a `figure`, but it is the {kind:"stat"|"quote"}
      // card the FTA vocabulary has always had, and running the chart validator over it rejects
      // every lesson that uses one — which is every Black Belt class. Hence the type check first.
      const fig = step.type === "chart" ? step.figure : step.type === "prediction" ? step.chart : null;
      if (!fig) continue;
      for (const p of validateChartFigure(fig, `${entry.match.title} · ${step.id}`)) problems.push(p);
    }
  }
  if (problems.length) {
    console.error(`ABORT — ${problems.length} chart problem(s); nothing written:`);
    for (const p of problems) console.error(`  · ${p}`);
    process.exit(1);
  }
}

// Resolve every row FIRST. Nothing is written until all of them match.
const resolved = [];
for (const entry of batch) {
  const { course, title } = entry.match;
  const rows = await sql(`
    select l.id, l.title, (l.steps is not null) had_steps
    from lessons l join modules m on m.id = l.module_id join courses c on c.id = m.course_id
    where c.slug = ${lit(course)} and l.title = ${lit(title)}`, true);
  if (rows.length !== 1) {
    console.error(`ABORT — "${title}" in ${course} matched ${rows.length} rows, expected exactly 1`);
    process.exit(1);
  }
  resolved.push({ ...entry, row: rows[0] });
}

for (const { row, json } of resolved) {
  if (clear) {
    await sql(`update lessons set steps = null where id = ${lit(row.id)}`);
    console.log(`cleared  ${row.title}`);
    continue;
  }
  await sql(`update lessons set steps = ${lit(JSON.stringify(json))}::jsonb where id = ${lit(row.id)}`);
  const plan = json.steps.map((s) => s.label ?? s.type).join(" · ");
  console.log(`${row.had_steps ? "updated " : "INSTALLED"} ${json.title}`);
  console.log(`          ${json.steps.length} sections: ${plan}`);
  console.log(`          /lesson/${row.id}`);
}

const ids = resolved.map((r) => lit(r.row.id)).join(", ");
const after = await sql(`select count(*) filter (where steps is not null) with_steps, count(*) total from lessons where id in (${ids})`, true);
console.log(`\n${after[0].with_steps} of ${after[0].total} rows now carry steps`);
