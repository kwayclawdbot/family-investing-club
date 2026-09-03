/**
 * Create (or repair) the `belt-black` course rows — course → 6 modules → 12 lessons.
 *
 *   node scripts/create-belt-black.mjs          # apply
 *   node scripts/create-belt-black.mjs --dry    # show what it would do, write nothing
 *
 * Black Belt is the last of the five belt courses in docs/BELT-CURRICULUM.md §8, and this script
 * is the correction of that section's one bad instruction. §8 proposed reusing the existing
 * `fta-trade-ready` rows as Black Belt "same twelve lesson rows, same ids, content added". Those
 * rows are served by the FROZEN app at app.familyinvestingclub.com, whose lesson engine ships six
 * step types (explainer, multiple_choice, true_false, match_pairs, prediction, real_world). The
 * Black Belt content uses nine more — chart, takeaways, compare, process, flip_cards and the rest —
 * so writing it onto those rows turned a course that read "no content yet" into a course that read
 * "This step isn't available in your app version" with a Skip button, on lessons paying academy
 * members can open today. Black Belt therefore gets its OWN rows, and `fta-trade-ready` goes back
 * to empty.
 *
 * Same construction as scripts/create-belt-white.mjs: idempotent (matched by slug, then title
 * within course, then title within module), atomic (one PL/pgSQL block), and it never names
 * `steps`, so a re-run cannot wipe content. The teaching content is installed separately:
 *   node scripts/install-lessons.mjs scripts/content/belt-black-w1.json
 *   node scripts/install-lessons.mjs scripts/content/belt-black-w2-w3.json
 *   node scripts/install-lessons.mjs scripts/content/belt-black-w4-w6.json
 *
 * `published = false` is deliberate and is the isolation. The frozen app gates every course
 * listing on `courses.published` — `/courses` (`.eq("published", true)`), `/fta/courses`,
 * `/progress`, the `get_home_state` RPC, `/family/learn`, the kid hero and the service-role search
 * route — and so does the RLS policy `Members read published courses`. Unpublished, a belt course
 * cannot appear anywhere in the old app. Migration `supabase/migrations/…_belt_courses_fic_only.sql`
 * grants members read access to the belt rows in spite of that flag, and this app asks for them by
 * slug (src/lib/live/learning.ts). Six week titles rather than belt-numeral ones, because the
 * content refers to them: Black Belt is the 6-week Trade Ready programme.
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

/* ── the shape, exactly as docs/BELT-CURRICULUM.md §6 and §8 specify it ── */

const COURSE = {
  slug: "belt-black",
  title: "Black Belt — Trade Ready",
  description:
    "The first tier of the academy. Six weeks on structure, zones, sweeps, gaps and the opening range — then a chart you have never seen, marked and traded on paper under observation.",
  program: "fta",
  min_tier: "academy",
  sort_order: -1,
  published: false,
};

/** Class vs drill: a class is read, a drill is three calls and a wrap. */
const CLASS = { est_minutes: 14, xp: 50 };
const DRILL = { est_minutes: 9, xp: 50 };

const MODULES = [
  {
    title: "Week 1 — Market Structure: Who Really Moves the Price",
    description: "Highs, lows, trend structure, and the big-player story. Intro to liquidity: where is everyone's stop loss hiding?",
    sort_order: 1,
    lessons: [
      { title: "Live Class: Market Structure & Who Moves Price", description: "HH/HL structure mapping on real charts, plus the whale-needs-to-buy story and the pool-party liquidity intro.", ...CLASS },
      { title: "Drill: Map the Structure on 3 Charts", description: "Mark highs, lows, and trend on three fresh charts. Bring them Saturday — we review YOURS.", ...DRILL },
    ],
  },
  {
    title: "Week 2 — Supply & Demand: Where the Big Money Hides",
    description: "Where banks bought and sold, why price returns to unmitigated zones, and how to draw them properly.",
    sort_order: 2,
    lessons: [
      { title: "Live Class: Supply & Demand Zones", description: "The warehouse-restock story, drawing zones properly, and zone flips on break. NVDA/SPY replays.", ...CLASS },
      { title: "Drill: Draw 3 Zones on Real Charts", description: "Find and draw three unmitigated zones. Predict which one price returns to first.", ...DRILL },
    ],
  },
  {
    title: "Week 3 — Liquidity Sweeps: The Bait & the Grab",
    description: "Equal highs and lows as bait, the sweep-then-reverse model, and sweeps as trade confirmation.",
    sort_order: 3,
    lessons: [
      { title: "Live Class: Liquidity Sweeps (The Bait & the Grab)", description: "Equal highs/lows as bait, the fishing-lure move, sweep-then-reverse, and CHoCH confirmation.", ...CLASS },
      { title: "Drill: Find 3 Equal-Lows Charts & Predict the Sweep", description: "Hunt three charts with equal lows. Call the sweep before it happens.", ...DRILL },
    ],
  },
  {
    title: "Week 4 — Fair Value Gaps: The Gaps Price Comes Back to Fill",
    description: "The 3-candle FVG, why gaps fill, and the FVG as your entry zone.",
    sort_order: 4,
    lessons: [
      { title: "Live Class: Fair Value Gaps", description: "The 3-candle imbalance, skipped-stairs-get-rebuilt, internal vs external liquidity, FVG as the entry.", ...CLASS },
      { title: "Drill: Mark 3 FVGs & Watch the Fill", description: "Mark three fresh FVGs and track which fill first.", ...DRILL },
    ],
  },
  {
    title: "Week 5 — ORB: The Opening Bell Play",
    description: "The opening range, why the open concentrates volume, and range - break - retest - target.",
    sort_order: 5,
    lessons: [
      { title: "Live Class: The Opening Range Breakout", description: "Gates-open-at-the-racetrack: the opening range, break, retest, target — with real ORB days from the scanner.", ...CLASS },
      { title: "Drill: Replay 3 ORB Days", description: "Range, break, retest, target — walk three historical opens and log each play.", ...DRILL },
    ],
  },
  {
    title: "Week 6 — The Full Playbook + Trade Ready Exam",
    description: "Structure, zone, sweep, FVG, ORB timing — the complete checklist, live walkthroughs, and your certification.",
    sort_order: 6,
    lessons: [
      { title: "Live Class: The Full Execution Model", description: "Structure, zone, sweep, FVG, ORB timing — complete trades start to finish, live.", ...CLASS },
      { title: "Trade Ready Exam: Fresh Chart + Paper Trade", description: "Mark up a chart you have never seen and execute a paper trade with the full checklist. Pass = certified.", est_minutes: 15, xp: 50 },
    ],
  },
];

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
  // track stays NULL, as it is on every `program = 'fta'` module already in this database.
  body.push(`  select id into v_module from modules where course_id = v_course and title = ${lit(m.title)};`);
  body.push(`  if v_module is null then`);
  body.push(`    insert into modules (course_id, title, description, track, sort_order)`);
  body.push(`    values (v_course, ${lit(m.title)}, ${lit(m.description)}, null, ${m.sort_order}) returning id into v_module;`);
  body.push(`  else`);
  body.push(`    update modules set description = ${lit(m.description)}, track = null, sort_order = ${m.sort_order} where id = v_module;`);
  body.push(`  end if;`);
  m.lessons.forEach((l, i) => {
    // `steps` is never named here — content is installed separately and must survive a re-run.
    body.push(`  select id into v_lesson from lessons where module_id = v_module and title = ${lit(l.title)};`);
    body.push(`  if v_lesson is null then`);
    body.push(`    insert into lessons (module_id, title, description, drip_week, has_quiz, sort_order, is_free, est_minutes, lesson_xp, node_kind, retired)`);
    body.push(`    values (v_module, ${lit(l.title)}, ${lit(l.description)}, ${m.sort_order}, false, ${i}, false, ${l.est_minutes}, ${l.xp}, 'lesson', false);`);
    body.push(`  else`);
    body.push(`    update lessons set description = ${lit(l.description)}, drip_week = ${m.sort_order}, has_quiz = false, sort_order = ${i},`);
    body.push(`      is_free = false, est_minutes = ${l.est_minutes}, lesson_xp = ${l.xp}, node_kind = 'lesson', retired = false where id = v_lesson;`);
    body.push(`  end if;`);
  });
}

const block = `do $belt$\ndeclare\n  v_course uuid;\n  v_module uuid;\n  v_lesson uuid;\nbegin\n${body.join("\n")}\nend $belt$;`;

if (DRY) {
  console.log(`\n--- dry run · nothing written ---\n${block}\n`);
  process.exit(0);
}

await sql(block);

/* ── after ── */

const rows = await sql(
  `select m.sort_order msort, m.title mtitle, l.id lid, l.sort_order lsort, l.title ltitle, l.est_minutes, l.lesson_xp, (l.steps is not null) has_steps
     from courses c join modules m on m.course_id = c.id join lessons l on l.module_id = m.id
    where c.slug = ${lit(COURSE.slug)} order by m.sort_order, l.sort_order`,
  true,
);
const expected = MODULES.reduce((n, m) => n + m.lessons.length, 0);
if (rows.length !== expected) {
  console.error(`ABORT — ${rows.length} lesson rows after apply, expected ${expected}. Inspect before running install-lessons.`);
  process.exit(1);
}

console.log(`\n${COURSE.slug} — ${COURSE.title}   (published=${COURSE.published})`);
let seen = "";
for (const r of rows) {
  if (r.mtitle !== seen) { seen = r.mtitle; console.log(`  ${r.msort}. ${r.mtitle}`); }
  console.log(`     ${r.lsort}. ${r.ltitle}  ·  ${r.est_minutes} min · ${r.lesson_xp} XP · ${r.has_steps ? "has steps" : "EMPTY — run install-lessons"}  /lesson/${r.lid}`);
}
const withSteps = rows.filter((r) => r.has_steps).length;
console.log(`\n${MODULES.length} modules · ${rows.length} lessons · ${withSteps} carry content`);
if (withSteps < rows.length) {
  console.log(`\nnext: node scripts/install-lessons.mjs scripts/content/belt-black-w1.json`);
  console.log(`      node scripts/install-lessons.mjs scripts/content/belt-black-w2-w3.json`);
  console.log(`      node scripts/install-lessons.mjs scripts/content/belt-black-w4-w6.json`);
}
