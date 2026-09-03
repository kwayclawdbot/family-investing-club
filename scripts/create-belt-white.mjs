/**
 * Create (or repair) the `belt-white` course rows — course → 2 modules → 8 lessons.
 *
 *   node scripts/create-belt-white.mjs          # apply
 *   node scripts/create-belt-white.mjs --dry    # show what it would do, write nothing
 *
 * The White Belt is the first of the five belt courses in docs/BELT-CURRICULUM.md §8. This script
 * only ever makes the SKELETON; the teaching content goes in afterwards with
 * `node scripts/install-lessons.mjs scripts/content/belt-white-m1.json` (and -m2), which writes
 * `lessons.steps`. Nothing here reads or writes `steps`, so re-running it can never wipe content.
 *
 * Idempotent: rows are matched by slug (course), by title within the course (module) and by title
 * within the module (lesson), then updated in place. A second run makes no change and says so.
 * Atomic: the whole skeleton is one PL/pgSQL block, so a failure halfway leaves nothing behind —
 * a half-built course is worse than none.
 *
 * Column values mirror `fic-kids-corner`, the one complete published FIC course, so belt-white
 * renders identically to what already ships: program `fic`, min_tier `challenge`, published,
 * modules.track set, lessons carrying est_minutes / lesson_xp / node_kind / drip_week, is_free and
 * has_quiz false (the knowledge checks live inside `steps`, and there is no `quizzes` row).
 *
 * sort_order −5 puts the belt spine ahead of the existing club courses (0…3) on the Learn shelf,
 * leaving −4/−3/−2 for Yellow/Green/Blue, without touching a single existing row.
 */
import { execSync } from "node:child_process";

const REF = "zvkercqohmmeyofycbgr";
const DRY = process.argv.includes("--dry");

let tok = execSync('security find-generic-password -s "Supabase CLI" -w', { encoding: "utf8" }).trim();
if (tok.startsWith("go-keyring-base64:")) tok = Buffer.from(tok.slice("go-keyring-base64:".length), "base64").toString("utf8").trim();

async function sql(query, readOnly = false) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, ...(readOnly ? { read_only: true } : {}) }),
  });
  const body = await r.text();
  if (!r.ok) { console.error(r.status, body.slice(0, 800)); process.exit(1); }
  return JSON.parse(body);
}
const lit = (s) => (s === null || s === undefined ? "null" : `'${String(s).replace(/'/g, "''")}'`);

/* ── the shape, exactly as docs/BELT-CURRICULUM.md §2 specifies it ── */

const COURSE = {
  slug: "belt-white",
  title: "White Belt — What You Own",
  description:
    "The front door. By the end you can say what a stock is, why anyone buys one, and what makes the price move — in your own words, to someone else.",
  program: "fic",
  min_tier: "challenge",
  sort_order: -5,
  published: true,
};

const MODULES = [
  {
    title: "White I — Money That Works",
    description: "Where money comes from, why time beats size, what inflation takes, and what a share actually is.",
    track: "adults",
    sort_order: 1,
    lessons: [
      { title: "The Four Ways to Make Money", description: "Work, business, investing, trading — and the one test that separates them.", est_minutes: 10 },
      { title: "Compounding — Why Starting Early Beats Starting Big", description: "Why $24,000 started at 25 beats $72,000 started at 35.", est_minutes: 11 },
      { title: "Inflation — The Reason Saving Alone Loses", description: "The number in the account holds. What it buys does not.", est_minutes: 10 },
      { title: "What a Stock Actually Is", description: "A piece of a company and a claim on its earnings — not a ticket with a name on it.", est_minutes: 11 },
    ],
  },
  {
    title: "White II — The Market",
    description: "Who is on the other side of your order, what moves the price, and how to read a real quote.",
    track: "adults",
    sort_order: 2,
    lessons: [
      { title: "How the Market Works", description: "How one order finds a match, and why the price is just the last trade.", est_minutes: 11 },
      { title: "What Moves a Price", description: "Every trade has both sides. What changes is who is willing to move.", est_minutes: 11 },
      { title: "Tickers, Exchanges and Indices", description: "Three words with three different jobs, and why you cannot buy an index.", est_minutes: 10 },
      { title: "Reading a Stock Quote", description: "A real session, number by number — then one company onto your watchlist.", est_minutes: 12 },
    ],
  },
];

const LESSON_XP = 50; // src/lib/learn/schema.ts → LEARN_XP.LESSON

/* ── before ── */

const before = await sql(
  `select c.slug, c.title, c.published, c.sort_order,
          (select count(*) from modules m where m.course_id = c.id) modules,
          (select count(*) from lessons l join modules m on m.id = l.module_id where m.course_id = c.id) lessons,
          (select count(*) from lessons l join modules m on m.id = l.module_id where m.course_id = c.id and l.steps is not null) with_steps
     from courses c where c.slug = ${lit(COURSE.slug)}`,
  true,
);
if (before.length) {
  const b = before[0];
  console.log(`found    ${b.slug} — ${b.modules} modules · ${b.lessons} lessons · ${b.with_steps} with steps · published=${b.published} · sort ${b.sort_order}`);
} else {
  console.log(`absent   ${COURSE.slug} — will be created`);
}

/* ── the whole skeleton as one transaction ── */

const body = [];
body.push(`  select id into v_course from courses where slug = ${lit(COURSE.slug)};`);
body.push(`  if v_course is null then`);
body.push(`    insert into courses (slug, title, description, program, min_tier, sort_order, published)`);
body.push(`    values (${lit(COURSE.slug)}, ${lit(COURSE.title)}, ${lit(COURSE.description)}, ${lit(COURSE.program)}, ${lit(COURSE.min_tier)}, ${COURSE.sort_order}, ${COURSE.published})`);
body.push(`    returning id into v_course;`);
body.push(`  else`);
body.push(`    update courses set title = ${lit(COURSE.title)}, description = ${lit(COURSE.description)}, program = ${lit(COURSE.program)},`);
body.push(`      min_tier = ${lit(COURSE.min_tier)}, sort_order = ${COURSE.sort_order}, published = ${COURSE.published}, updated_at = now()`);
body.push(`    where id = v_course;`);
body.push(`  end if;`);

for (const m of MODULES) {
  body.push(`  select id into v_module from modules where course_id = v_course and title = ${lit(m.title)};`);
  body.push(`  if v_module is null then`);
  body.push(`    insert into modules (course_id, title, description, track, sort_order)`);
  body.push(`    values (v_course, ${lit(m.title)}, ${lit(m.description)}, ${lit(m.track)}, ${m.sort_order}) returning id into v_module;`);
  body.push(`  else`);
  body.push(`    update modules set description = ${lit(m.description)}, track = ${lit(m.track)}, sort_order = ${m.sort_order} where id = v_module;`);
  body.push(`  end if;`);
  m.lessons.forEach((l, i) => {
    // `steps` is never named here — content is installed separately and must survive a re-run.
    body.push(`  select id into v_lesson from lessons where module_id = v_module and title = ${lit(l.title)};`);
    body.push(`  if v_lesson is null then`);
    body.push(`    insert into lessons (module_id, title, description, drip_week, has_quiz, sort_order, is_free, est_minutes, lesson_xp, node_kind, retired)`);
    body.push(`    values (v_module, ${lit(l.title)}, ${lit(l.description)}, ${m.sort_order}, false, ${i}, false, ${l.est_minutes}, ${LESSON_XP}, 'lesson', false);`);
    body.push(`  else`);
    body.push(`    update lessons set description = ${lit(l.description)}, drip_week = ${m.sort_order}, has_quiz = false, sort_order = ${i},`);
    body.push(`      is_free = false, est_minutes = ${l.est_minutes}, lesson_xp = ${LESSON_XP}, node_kind = 'lesson', retired = false where id = v_lesson;`);
    body.push(`  end if;`);
  });
}

// $belt$ rather than $$ — the copy carries dollar amounts, and a stray `$$` inside a literal would
// close the block early.
const block = `do $belt$\ndeclare\n  v_course uuid;\n  v_module uuid;\n  v_lesson uuid;\nbegin\n${body.join("\n")}\nend $belt$;`;

if (DRY) {
  console.log(`\n--- dry run · nothing written ---\n${block}\n`);
  process.exit(0);
}

await sql(block);

/* ── after ── */

const rows = await sql(
  `select m.sort_order msort, m.title mtitle, l.sort_order lsort, l.title ltitle, l.est_minutes, l.lesson_xp, (l.steps is not null) has_steps
     from courses c join modules m on m.course_id = c.id join lessons l on l.module_id = m.id
    where c.slug = ${lit(COURSE.slug)} order by m.sort_order, l.sort_order`,
  true,
);
const expected = MODULES.reduce((n, m) => n + m.lessons.length, 0);
if (rows.length !== expected) {
  console.error(`ABORT — ${rows.length} lesson rows after apply, expected ${expected}. Inspect before running install-lessons.`);
  process.exit(1);
}

console.log(`\n${COURSE.slug} — ${COURSE.title}`);
let seen = "";
for (const r of rows) {
  if (r.mtitle !== seen) { seen = r.mtitle; console.log(`  ${r.msort}. ${r.mtitle}`); }
  console.log(`     ${r.lsort}. ${r.ltitle}  ·  ${r.est_minutes} min · ${r.lesson_xp} XP · ${r.has_steps ? "has steps" : "EMPTY — run install-lessons"}`);
}
const withSteps = rows.filter((r) => r.has_steps).length;
console.log(`\n${MODULES.length} modules · ${rows.length} lessons · ${withSteps} carry content`);
if (withSteps < rows.length) {
  console.log(`\nnext: node scripts/install-lessons.mjs scripts/content/belt-white-m1.json`);
  console.log(`      node scripts/install-lessons.mjs scripts/content/belt-white-m2.json`);
}
