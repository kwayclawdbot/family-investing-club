-- FIC ↔ FTA bridge: one club per family (Backend Cutover Plan, Phase 1).
-- Additive only: new functions + one policy. No FTA table is altered.
--
--   fic_ensure_family_club(name, kind, privacy)  — caller's family gets a club (idempotent) and
--                                                  every profile in the family becomes a member.
--   fic_backfill_family_clubs()                  — service-role: same for every family without a club.
--   fic_sync_family_members(club_id)             — internal helper shared by both.

create or replace function public.fic_sync_family_members(p_club uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family uuid;
  v_added integer := 0;
begin
  select family_id into v_family from fic_clubs where id = p_club;
  if v_family is null then return 0; end if;

  insert into fic_club_members (club_id, user_id, role, vote_gated, gate_reason)
  select p_club, p.id,
         case when p.role = 'child' or p.age_group in ('kids','teens') then 'child'
              when p.role = 'admin' then 'admin' else 'member' end,
         false, null
    from profiles p
   where p.family_id = v_family
     and not exists (select 1 from fic_club_members m where m.club_id = p_club and m.user_id = p.id);
  get diagnostics v_added = row_count;
  return v_added;
end;
$$;
-- Supabase's default privileges grant EXECUTE to anon/authenticated on new functions — revoke those explicitly.
revoke all on function public.fic_sync_family_members(uuid) from public, anon, authenticated;
grant execute on function public.fic_sync_family_members(uuid) to service_role;

create or replace function public.fic_ensure_family_club(
  p_name text default null,
  p_kind text default 'family',
  p_privacy text default 'private'
)
returns fic_clubs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_family uuid;
  v_family_name text;
  v_club fic_clubs;
  v_name text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select family_id into v_family from profiles where id = v_uid;
  if v_family is null then
    -- Solo member or a parent who skipped the family step: the family IS the tenant, so create it
    -- (idempotent inside onboard_create_family) with the club name as the household name.
    v_family := public.onboard_create_family(coalesce(nullif(trim(p_name), ''), 'My Family'), null, null, 'family');
  end if;

  select * into v_club from fic_clubs where family_id = v_family order by created_at limit 1;
  if v_club.id is null then
    select name into v_family_name from families where id = v_family;
    v_name := coalesce(nullif(trim(p_name), ''), nullif(trim(v_family_name), '') || ' Investing Club', 'Our Investing Club');
    v_club := public.fic_create_club(v_name,
                case when p_kind in ('family','friends','mixed') then p_kind else 'family' end,
                case when p_privacy = 'public' then 'public' else 'private' end);
    update fic_clubs set family_id = v_family where id = v_club.id;
    v_club.family_id := v_family;
  end if;

  perform public.fic_sync_family_members(v_club.id);
  return v_club;
end;
$$;
grant execute on function public.fic_ensure_family_club(text, text, text) to authenticated;

create or replace function public.fic_backfill_family_clubs()
returns table (family_id uuid, club_id uuid, created boolean, members_added integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  f record;
  v_club uuid;
  v_created boolean;
  v_founder uuid;
  v_code text;
begin
  -- Service-role only (auth.uid() is null there). Belt-and-braces beside the grants below.
  if auth.uid() is not null then
    raise exception 'fic_backfill_family_clubs: service role only' using errcode = '42501';
  end if;
  for f in select fam.id, fam.name from families fam loop
    v_created := false;
    select c.id into v_club from fic_clubs c where c.family_id = f.id order by c.created_at limit 1;
    if v_club is null then
      -- founder = earliest parent/admin in the family; skip families with no adult profile
      select p.id into v_founder from profiles p
       where p.family_id = f.id and p.role in ('parent','admin')
       order by p.created_at limit 1;
      if v_founder is null then continue; end if;
      loop
        v_code := upper(substr(regexp_replace(coalesce(f.name, 'CLUB'), '[^A-Za-z]', '', 'g') || 'XXXX', 1, 4)) || '-' || lpad((floor(random() * 100))::text, 2, '0');
        exit when not exists (select 1 from fic_clubs where invite_code = v_code);
      end loop;
      insert into fic_clubs (name, short_name, kind, privacy, family_id, founder_id, invite_code)
      values (coalesce(nullif(trim(f.name), '') || ' Investing Club', 'Our Investing Club'),
              coalesce(nullif(trim(f.name), '') || ' Club', 'Our Club'),
              'family', 'private', f.id, v_founder, v_code)
      returning id into v_club;
      insert into fic_club_members (club_id, user_id, role) values (v_club, v_founder, 'founder');
      v_created := true;
    end if;
    family_id := f.id; club_id := v_club; created := v_created;
    members_added := public.fic_sync_family_members(v_club);
    return next;
  end loop;
end;
$$;
revoke all on function public.fic_backfill_family_clubs() from public, anon, authenticated;
grant execute on function public.fic_backfill_family_clubs() to service_role;

-- Clubmates can see each other's XP even when they're in different households (friends/mixed clubs).
-- Family members already can (FTA policy "Family members read xp"); this is additive.
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'xp_events' and policyname = 'Clubmates read xp') then
    create policy "Clubmates read xp" on public.xp_events for select to authenticated
      using (exists (
        select 1 from fic_club_members me
        join fic_club_members them on them.club_id = me.club_id
        where me.user_id = auth.uid() and them.user_id = xp_events.user_id));
  end if;
end $$;
