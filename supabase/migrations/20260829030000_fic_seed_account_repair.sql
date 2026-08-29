-- Repair the four Mensah demo accounts seeded by 20260827120100_fic_seed_mensah.sql.
--
-- 1. They were inserted straight into auth.users with the token columns left NULL. GoTrue reads those
--    columns as NOT NULL text, so ANY sign-in attempt for them fails with "Database error finding user"
--    — which also blocks testing the child experience. Empty string is what GoTrue writes itself.
-- 2. `arielle@mensah.club` is `role='child'` + `vote_gated` in fic_club_members but was left
--    `role='parent'` on her profile, so the app (which derives the child shell and kid-safe gates from
--    `profiles`) would have given her the adult experience. The club row is the intent; the profile follows.
--
-- Scope is pinned to the seeded placeholders (`raw_user_meta_data->>'placeholder' = 'true'` AND the
-- @mensah.club domain). Verified before applying: no other auth.users row has NULL tokens, so no real
-- member is touched. Passwords stay empty — these accounts are magic-link only until someone claims them.

update auth.users
   set confirmation_token         = coalesce(confirmation_token, ''),
       recovery_token             = coalesce(recovery_token, ''),
       email_change               = coalesce(email_change, ''),
       email_change_token_new     = coalesce(email_change_token_new, ''),
       email_change_token_current = coalesce(email_change_token_current, ''),
       phone_change               = coalesce(phone_change, ''),
       phone_change_token         = coalesce(phone_change_token, ''),
       reauthentication_token     = coalesce(reauthentication_token, ''),
       email_confirmed_at         = coalesce(email_confirmed_at, now())
 where email like '%@mensah.club'
   and coalesce(raw_user_meta_data->>'placeholder', '') = 'true';

-- Profile follows the club row for the one seeded minor. The privileged-columns guard is bypassed
-- transaction-locally, the same way redeem_invite/onboard_create_family do it.
do $$
declare v_id uuid;
begin
  select u.id into v_id
    from auth.users u
   where u.email = 'arielle@mensah.club'
     and coalesce(u.raw_user_meta_data->>'placeholder', '') = 'true';
  if v_id is null then return; end if;

  perform set_config('app.profile_guard_bypass', 'on', true);
  update profiles
     set role      = 'child',
         age_group = coalesce(age_group, 'teens'),
         track     = coalesce(track, 'teens')
   where id = v_id and role <> 'child';
  perform set_config('app.profile_guard_bypass', 'off', true);
end $$;
