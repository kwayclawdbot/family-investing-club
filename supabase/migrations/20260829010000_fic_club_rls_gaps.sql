-- 20260829010000_fic_club_rls_gaps — Phase 2 (Lane CLUB): close the RLS gaps flagged in the club audit.
-- Additive only; fic_* objects only. NOT applied by the lane — the lead applies via scripts/db-apply.mjs.
--
-- Gaps closed:
--   1. fic_club_pick_replies — authors could insert but never edit or withdraw a reply.
--   2. fic_club_asks         — authors could insert but never edit or withdraw a question.
--   3. fic_club_research     — the UPDATE policy let ANY club member rewrite any assignment
--                              (status/notes/assignee). Now: the assignee, the club founder, a club
--                              admin, or a site admin. Members may still INSERT (unchanged).
--
-- /api/club/ask DELETE and /api/club/pick/reply DELETE already ship in the app and answer 404
-- ("can't be withdrawn yet") until this file lands — RLS simply matches zero rows.

-- 1. Pick replies: author edits / withdraws their own row
drop policy if exists "replies: author updates" on fic_club_pick_replies;
create policy "replies: author updates" on fic_club_pick_replies
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "replies: author deletes" on fic_club_pick_replies;
create policy "replies: author deletes" on fic_club_pick_replies
  for delete using (author_id = auth.uid());

-- 2. Asks: author edits / withdraws their own question
drop policy if exists "asks: author updates" on fic_club_asks;
create policy "asks: author updates" on fic_club_asks
  for update using (author_id = auth.uid()) with check (author_id = auth.uid() and fic_is_club_member(club_id));

drop policy if exists "asks: author deletes" on fic_club_asks;
create policy "asks: author deletes" on fic_club_asks
  for delete using (author_id = auth.uid());

-- 3. Research: only the assignee, the founder, a club admin or a site admin may update
create or replace function fic_can_manage_club(p_club uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from fic_club_members m
    where m.club_id = p_club and m.user_id = auth.uid() and m.role in ('founder', 'admin')
  ) or exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  );
$$;
grant execute on function fic_can_manage_club(uuid) to authenticated;

drop policy if exists "research: assignee/author update" on fic_club_research;
drop policy if exists "research: assignee or club admin updates" on fic_club_research;
create policy "research: assignee or club admin updates" on fic_club_research
  for update
  using (fic_is_club_member(club_id) and (assignee_id = auth.uid() or fic_can_manage_club(club_id)))
  with check (fic_is_club_member(club_id));

-- Unassigned research ("volunteer to research") is claimable by any member — assignee_id is null so
-- the assignee test above cannot match; allow the claim explicitly (row must still be unassigned).
drop policy if exists "research: members claim unassigned" on fic_club_research;
create policy "research: members claim unassigned" on fic_club_research
  for update
  using (fic_is_club_member(club_id) and assignee_id is null)
  with check (fic_is_club_member(club_id) and assignee_id = auth.uid());
