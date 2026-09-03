-- ── The belt courses belong to this app, and only to this app ────────────────────────────────
--
-- Two Next apps read this one database. `fta-dashboard-v3` is frozen at b9f5b7e and serves
-- app.familyinvestingclub.com to paying members today; it cannot be redeployed, so anything the
-- belt courses need has to be true of the DATABASE, not of its code.
--
-- Its lesson engine ships six step types — explainer, multiple_choice, true_false, match_pairs,
-- prediction, real_world (src/components/learn/LessonEngine/registry.tsx). Everything the belts
-- are built out of — chart, takeaways, compare, process, flip_cards, ratio_explorer,
-- annotated_values, anatomy, build_candle — renders there as "This step isn't available in your
-- app version" with a Skip button. A belt course visible to that app is a broken course.
--
-- `courses.published` is the flag the frozen app already honours everywhere it lists a course:
--
--   src/app/(dashboard)/courses/page.tsx:149          .in("program",["fic","fta"]).eq("published", true)
--   src/app/(dashboard)/fta/courses/page.tsx:84       .eq("program","fta").eq("published", true)
--   src/app/(dashboard)/courses/[slug]/page.tsx:110   .eq("slug", slug).eq("published", true)
--   src/components/you/ProfileSurface.tsx:244         .eq("published", true)
--   src/lib/family/queries.ts:425                     if (!course?.published …) continue
--   src/components/family/KidTodayHero.tsx:197        if (!course?.published …) return false
--   src/app/api/search/route.ts:116                   .filter(l => l.modules.courses.published)   ← the one service-role path
--   migration 030, get_home_state()                   where c.program = 'fic' and c.published
--
-- So the belts are UNPUBLISHED, and that is the isolation. What is left is letting THIS app still
-- read them, because the policy `Members read published courses` is `using (published = true)` and
-- cascades to modules and lessons. Postgres RLS policies are OR-ed, so three narrow policies
-- addressed at the belt slugs restore the read without widening anything else. The frozen app
-- gains nothing from them: every listing above filters `published` in its own SQL, so the rows
-- stay out of its shelves, its progress page, its home loop, its family lane and its search.
--
-- Deliberately slug-shaped rather than a new column: the frozen app cannot be taught a new column,
-- and `published` is the only flag it already checks on every surface.

drop policy if exists "Members read belt courses" on public.courses;
create policy "Members read belt courses" on public.courses
  for select to authenticated
  using (slug like 'belt-%');

drop policy if exists "Members read belt modules" on public.modules;
create policy "Members read belt modules" on public.modules
  for select to authenticated
  using (course_id in (select id from public.courses where slug like 'belt-%'));

drop policy if exists "Members read belt lessons" on public.lessons;
create policy "Members read belt lessons" on public.lessons
  for select to authenticated
  using (
    retired = false
    and module_id in (
      select m.id from public.modules m
      join public.courses c on c.id = m.course_id
      where c.slug like 'belt-%'
    )
  );

-- White Belt shipped published this afternoon and was therefore live in the old app's shelves for
-- a few hours. Black Belt was created unpublished. Both are settled here so the state is in the
-- migration and not only in whatever script last ran.
update public.courses set published = false, updated_at = now()
 where slug like 'belt-%' and published;
