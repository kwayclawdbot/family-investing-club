-- Grandfather the belts members already wear.
--
-- Until 2026-09-03 the app derived a member's belt straight from their lifetime XP, so that IS the
-- belt they have been shown, told about, and seen on their own avatar. Switching to earned-by-test
-- without a backfill would silently demote every member to White Belt I overnight. Nobody loses a
-- belt they have been wearing.
--
-- These rows are marked `grandfathered`, not `test`, so the distinction stays visible: a real pass
-- carries a real score, and a grandfathered belt carries none. From here, every new belt is a test.

alter table public.fic_belt_awards
  add column if not exists source text not null default 'test'
    check (source in ('test', 'grandfathered'));

-- A grandfathered belt has no score to report; a tested one always does.
alter table public.fic_belt_awards alter column score_pct drop not null;
alter table public.fic_belt_awards drop constraint if exists fic_belt_awards_score_pct_check;
alter table public.fic_belt_awards
  add constraint fic_belt_awards_score_pct_check
  check ((source = 'grandfathered' and score_pct is null) or (source = 'test' and score_pct between 0 and 100));

-- Every level up to and including the one their XP had already earned them.
insert into public.fic_belt_awards (user_id, belt_level, score_pct, xp_at_award, source)
select x.user_id, lv.level, null, x.xp, 'grandfathered'
from (
  select user_id, coalesce(sum(amount), 0)::int as xp
  from public.xp_events
  group by user_id
) x
join lateral (
  select * from (values (1, 0), (2, 150), (3, 400), (4, 800), (5, 1400), (6, 2200), (7, 3200)) as t(level, min_xp)
  where t.min_xp <= x.xp
) lv on true
on conflict (user_id, belt_level) do nothing;

comment on column public.fic_belt_awards.source is
  'test = passed a belt test (score_pct set). grandfathered = held under the pre-2026-09-03 XP-derived model (no score).';
