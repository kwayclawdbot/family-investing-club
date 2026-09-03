-- Belts are EARNED BY TEST, not by XP.
--
-- Until now `beltFor(lifetimeXp)` handed a member a belt the moment they crossed a threshold, which
-- made the belt a restatement of their XP. It is not. XP QUALIFIES a member to SIT the belt test;
-- passing the test awards the belt. A member can sit on 3,000 XP and still be a Yellow Belt because
-- they have not taken — or have not passed — the Green Belt test.
--
-- So two numbers now exist per member and they are not the same:
--   eligible level  — derived from lifetime XP (client-side, free, no storage)
--   awarded level   — the highest belt test they have PASSED (this table)
--
-- Nothing here changes XP, and nothing here is destructive. A member with no row is White Belt I,
-- which is what every member starts as.

create table if not exists public.fic_belt_awards (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  belt_level   int  not null check (belt_level between 1 and 7),
  score_pct    int  not null check (score_pct between 0 and 100),
  -- The XP the member held when they sat it, kept so a later threshold change stays auditable.
  xp_at_award  int  not null default 0,
  awarded_at   timestamptz not null default now(),
  -- One award per belt per member. Re-sitting a test you already passed changes nothing.
  unique (user_id, belt_level)
);

create index if not exists fic_belt_awards_user_idx on public.fic_belt_awards (user_id, belt_level desc);

alter table public.fic_belt_awards enable row level security;

-- A member reads their own awards and those of anyone they share a club with — a belt is a public
-- fact inside a club (it renders on every chip and avatar ring), but not across the whole platform.
drop policy if exists fic_belt_awards_select on public.fic_belt_awards;
create policy fic_belt_awards_select on public.fic_belt_awards
  for select using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.fic_club_members mine
      join public.fic_club_members theirs on theirs.club_id = mine.club_id
      where mine.user_id = auth.uid() and theirs.user_id = fic_belt_awards.user_id
    )
  );

-- No INSERT/UPDATE/DELETE policy on purpose: a member must never be able to write their own belt.
-- Awards come only through fic_award_belt() below, which is security definer and checks the rules.

/**
 * Award a belt for a passed test.
 *
 * Refuses to award a belt the member has not yet qualified for by XP, refuses to skip a belt, and
 * refuses a failing score. Returns the level actually awarded, or null when nothing was awarded.
 * Idempotent: sitting a passed test again is a no-op, not a duplicate row.
 */
create or replace function public.fic_award_belt(p_belt_level int, p_score_pct int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_xp int;
  v_min_xp int;
  v_highest int;
  -- The ladder, mirrored from src/lib/belts.ts. Index = level.
  v_thresholds int[] := array[0, 150, 400, 800, 1400, 2200, 3200];
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = 'P0001';
  end if;
  if p_belt_level < 1 or p_belt_level > 7 then
    raise exception 'no such belt level: %', p_belt_level using errcode = 'P0001';
  end if;
  -- 70% is the platform's pass mark everywhere else (QUIZ_PASS_PCT); a belt test is not easier.
  if p_score_pct < 70 then
    return null;
  end if;

  select coalesce(sum(amount), 0) into v_xp from public.xp_events where user_id = v_uid;
  v_min_xp := v_thresholds[p_belt_level];
  if v_xp < v_min_xp then
    raise exception 'not qualified: % XP, belt % needs %', v_xp, p_belt_level, v_min_xp using errcode = 'P0001';
  end if;

  select coalesce(max(belt_level), 1) into v_highest from public.fic_belt_awards where user_id = v_uid;
  -- Level 1 is the starting belt and is never awarded by test; the first real test is level 2.
  if p_belt_level > greatest(v_highest, 1) + 1 then
    raise exception 'belt % skipped: highest passed is %', p_belt_level, v_highest using errcode = 'P0001';
  end if;

  insert into public.fic_belt_awards (user_id, belt_level, score_pct, xp_at_award)
  values (v_uid, p_belt_level, p_score_pct, v_xp)
  on conflict (user_id, belt_level) do nothing;

  return p_belt_level;
end;
$$;

revoke all on function public.fic_award_belt(int, int) from public;
grant execute on function public.fic_award_belt(int, int) to authenticated;

comment on table public.fic_belt_awards is
  'Belts passed by test. XP qualifies a member to sit a belt test; this table records passing it. No row = White Belt I.';
