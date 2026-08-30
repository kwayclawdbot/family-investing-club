/**
 * Read-only discovery: which unlinked lesson rows have a slide deck sitting on the FTA content host?
 * Writes nothing. Prints a candidate map for a later, reviewed import.
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = Object.fromEntries(fs.readFileSync(".env.local","utf8").split("\n").filter(l=>l.includes("=")&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,"")]}));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const HOST = "https://fta-university.vercel.app";
const SLUG_DIR = { "tf-100": "TF-100-Adults", "tf-101": "TF-101-Adults", "tf-102": "TF-102-Adults", "tf-103": "TF-103-Adults", "inv-101": "INV-101-Adults", "sw-101": "SW-101-Adults", "dt-101": "DT-101-Adults" };

const { data: courses } = await db.from("courses").select("id, slug, title").eq("published", true);
const { data: mods } = await db.from("modules").select("id, course_id, sort_order, title");
const { data: lessons } = await db.from("lessons").select("id, module_id, title, sort_order, video_id").eq("retired", false);
const head = async (u) => { try { return (await fetch(u, { method: "GET" })).status === 200; } catch { return false; } };

for (const c of courses ?? []) {
  const dir = SLUG_DIR[c.slug]; if (!dir) continue;
  const cm = (mods ?? []).filter((m) => m.course_id === c.id).sort((a, b) => a.sort_order - b.sort_order);
  let found = 0, missing = 0;
  for (const [mi, m] of cm.entries()) {
    const ls = (lessons ?? []).filter((l) => l.module_id === m.id).sort((a, b) => a.sort_order - b.sort_order);
    for (const [li, l] of ls.entries()) {
      if (l.video_id) continue;
      const n = `${mi + 1}.${li + 1}`;
      const candidates = [
        `${HOST}/${dir}/Module-${mi + 1}/L${n}-slides.html`,
        `${HOST}/${dir}/Module-${mi + 1}/L${n}-slides-v2.html`,
        `${HOST}/${dir}/Module-${mi + 1}-v2/L${n}-lesson.html`,
        `${HOST}/${dir}/Module-${mi + 1}/L${n}-lesson.html`,
      ];
      let hit = null;
      for (const u of candidates) if (await head(u)) { hit = u; break; }
      if (hit) { found++; console.log(`  LINKABLE ${c.slug} ${n} "${l.title.slice(0, 38)}" → ${hit.replace(HOST, "")}`); }
      else missing++;
    }
  }
  if (found || missing) console.log(`${c.slug}: ${found} linkable, ${missing} with no deck found\n`);
}
