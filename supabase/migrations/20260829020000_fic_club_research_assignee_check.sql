-- 20260829020000_fic_club_research_assignee_check — close a hole left by 20260829010000_fic_club_rls_gaps.
--
-- Found by scripts/club-smoke.mjs: an ordinary club member (not the assignee, not a founder/admin)
-- could still set `assignee_id` to ANY member on an UNASSIGNED research row.
--
-- Why: both UPDATE policies are PERMISSIVE, so Postgres ORs the USING clauses AND ORs the WITH CHECK
-- clauses. "research: members claim unassigned" passes USING for an unassigned row, and
-- "research: assignee or club admin updates" carried a wildcard WITH CHECK (`fic_is_club_member`),
-- which satisfied the OR for any resulting row — including one assigned to somebody else. The claim
-- policy's own `assignee_id = auth.uid()` check was therefore unreachable.
--
-- Fix: the assignee/manager policy's WITH CHECK now mirrors its USING clause, so the only WITH CHECK
-- that can pass for a non-manager is the claim policy's self-assignment. Net effect, unchanged intent:
--   · assignee            → may edit their own row (status, notes) and keep it assigned to themselves
--   · founder/club admin/site admin → may edit and re-assign anything in the club
--   · any other member    → may claim an UNASSIGNED row for themselves, and nothing else
--
-- Additive, fic_* objects only.

drop policy if exists "research: assignee or club admin updates" on fic_club_research;
create policy "research: assignee or club admin updates" on fic_club_research
  for update
  using (fic_is_club_member(club_id) and (assignee_id = auth.uid() or fic_can_manage_club(club_id)))
  with check (fic_is_club_member(club_id) and (assignee_id = auth.uid() or fic_can_manage_club(club_id)));
