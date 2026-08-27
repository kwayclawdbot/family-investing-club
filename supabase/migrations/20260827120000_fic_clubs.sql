-- 0001_fic_clubs — Investing Club object layer (Product Shift §19: additive, never destructive).
-- Household (families) stays the guardian/account relationship. An Investing Club is the social object.
-- All tables are prefixed fic_club_* to coexist with the FTA schema in the same project.

create extension if not exists pgcrypto;

-- ── Clubs ────────────────────────────────────────────────────────────────
create table if not exists fic_clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  kind text not null default 'family' check (kind in ('family','friends','mixed')),
  privacy text not null default 'private' check (privacy in ('private','public')),
  family_id uuid references families(id) on delete set null,      -- auto-created family club links back to the household
  founder_id uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique default upper(substr(encode(gen_random_bytes(6),'hex'),1,8)),
  rules jsonb not null default '{"votes":"majority","kidsCanVote":true,"maxWeightPct":10,"weeklyPrompt":"Thu 7 PM"}',
  investing_night jsonb not null default '{"when":"Thu 7 PM","topic":null}',
  benchmark text not null default 'SPY',
  created_at timestamptz not null default now()
);

create table if not exists fic_club_members (
  club_id uuid not null references fic_clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('founder','admin','member','child')),
  vote_gated boolean not null default false,
  gate_reason text,
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);
create index if not exists fic_club_members_user on fic_club_members(user_id);

create table if not exists fic_club_invites (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references fic_clubs(id) on delete cascade,
  email text,
  invited_by uuid references auth.users(id),
  accepted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

-- ── Picks (fast, timestamped opinions) ───────────────────────────────────
create table if not exists fic_club_picks (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references fic_clubs(id) on delete cascade,        -- null = public pick
  author_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  company_name text,
  stance text not null check (stance in ('buy','watch','pass')),
  reason text not null check (char_length(reason) <= 280),
  horizon text not null check (horizon in ('1y','3y','5y+')),
  confidence smallint not null check (confidence between 1 and 5),
  visibility text not null default 'club' check (visibility in ('club','public')),
  price_at_pick numeric,
  verified_owner boolean not null default false,                   -- set only from a consented brokerage link
  resolved_at timestamptz,
  resolved_return_pct numeric,
  created_at timestamptz not null default now()
);
create index if not exists fic_club_picks_club on fic_club_picks(club_id, created_at desc);
create index if not exists fic_club_picks_symbol on fic_club_picks(symbol);

create table if not exists fic_club_pick_reactions (
  pick_id uuid not null references fic_club_picks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('agree','not_sure')),
  created_at timestamptz not null default now(),
  primary key (pick_id, user_id)
);

create table if not exists fic_club_pick_replies (
  id uuid primary key default gen_random_uuid(),
  pick_id uuid not null references fic_club_picks(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ── Proposals + votes (club model portfolio decisions) ───────────────────
create table if not exists fic_club_proposals (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references fic_clubs(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('add','remove','resize')),
  symbol text not null,
  company_name text,
  from_weight_pct numeric not null default 0,
  to_weight_pct numeric not null,
  rationale text not null,
  evidence jsonb not null default '[]',                            -- [{label, href}]
  concept_gate jsonb,                                              -- {concept, minutes, href}
  window_days int not null default 7,
  closes_at timestamptz not null default (now() + interval '7 days'),
  status text not null default 'open' check (status in ('open','passed','rejected','withdrawn')),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists fic_club_proposals_club on fic_club_proposals(club_id, status);

create table if not exists fic_club_votes (
  proposal_id uuid not null references fic_club_proposals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote text not null check (vote in ('for','against')),
  created_at timestamptz not null default now(),
  primary key (proposal_id, user_id)
);

-- ── Club model portfolio + decision journal ──────────────────────────────
create table if not exists fic_club_holdings (
  club_id uuid not null references fic_clubs(id) on delete cascade,
  symbol text not null,
  company_name text,
  weight_pct numeric not null,
  origin text,                                                     -- "Proposal #1 · unanimous"
  proposal_id uuid references fic_club_proposals(id) on delete set null,
  added_at timestamptz not null default now(),
  primary key (club_id, symbol)
);

create table if not exists fic_club_decisions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references fic_clubs(id) on delete cascade,
  proposal_id uuid references fic_club_proposals(id) on delete set null,
  decided_on date not null default current_date,
  title text not null,
  by_user uuid references auth.users(id),
  vote_result text,                                                -- "4-0"
  believed text, wrong_if text, review text, learned text,
  created_at timestamptz not null default now()
);

-- ── Research assignments + asks ──────────────────────────────────────────
create table if not exists fic_club_research (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references fic_clubs(id) on delete cascade,
  symbol text not null,
  company_name text,
  assignee_id uuid references auth.users(id),
  reason text,
  due_label text,
  status text not null default 'open' check (status in ('open','ready','done')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists fic_club_asks (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references fic_clubs(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  symbol text,
  created_at timestamptz not null default now()
);

-- ── Brokerage link + sharing consent (metadata only; holdings come from the aggregator) ──
create table if not exists fic_brokerage_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null,
  account_label text,
  sharing text not null default 'private' check (sharing in ('private','positions','allocation','full')),
  public_badge boolean not null default false,
  connected_at timestamptz not null default now(),
  synced_at timestamptz
);

-- ── Activity view (what happened) ────────────────────────────────────────
create or replace view fic_club_activity as
  select p.club_id, p.author_id as actor_id, 'pick' as kind, p.symbol, p.stance as detail, p.id as ref_id, p.created_at
    from fic_club_picks p where p.club_id is not null
  union all
  select r.club_id, r.author_id, 'proposal', r.symbol, r.kind, r.id, r.created_at from fic_club_proposals r
  union all
  select s.club_id, s.assignee_id, 'research', s.symbol, s.status, s.id, s.created_at from fic_club_research s where s.status <> 'open';

-- ── Helpers ──────────────────────────────────────────────────────────────
create or replace function fic_is_club_member(p_club uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from fic_club_members m where m.club_id = p_club and m.user_id = auth.uid());
$$;

create or replace function fic_create_club(p_name text, p_kind text default 'family', p_privacy text default 'private')
returns fic_clubs language plpgsql security definer set search_path = public as $$
declare c fic_clubs;
begin
  insert into fic_clubs(name, short_name, kind, privacy, founder_id)
    values (p_name, p_name, p_kind, p_privacy, auth.uid()) returning * into c;
  insert into fic_club_members(club_id, user_id, role) values (c.id, auth.uid(), 'founder');
  return c;
end $$;

create or replace function fic_join_club(p_code text) returns fic_clubs
language plpgsql security definer set search_path = public as $$
declare c fic_clubs;
begin
  select * into c from fic_clubs where invite_code = upper(p_code);
  if c.id is null then raise exception 'INVALID_CODE'; end if;
  insert into fic_club_members(club_id, user_id, role) values (c.id, auth.uid(), 'member') on conflict do nothing;
  return c;
end $$;

-- Resolve a proposal when its window closes (majority of eligible, non-gated members). Called by a cron or on read.
create or replace function fic_resolve_proposal(p_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare pr fic_club_proposals; eligible int; f int; a int; res text;
begin
  select * into pr from fic_club_proposals where id = p_id and status = 'open';
  if pr.id is null then return null; end if;
  if pr.closes_at > now() then return 'open'; end if;
  select count(*) into eligible from fic_club_members where club_id = pr.club_id and not vote_gated;
  select count(*) filter (where vote='for'), count(*) filter (where vote='against') into f, a from fic_club_votes where proposal_id = p_id;
  res := case when f > a and f * 2 > eligible then 'passed' else 'rejected' end;
  update fic_club_proposals set status = res, resolved_at = now() where id = p_id;
  if res = 'passed' then
    if pr.kind = 'remove' then delete from fic_club_holdings where club_id = pr.club_id and symbol = pr.symbol;
    else insert into fic_club_holdings(club_id, symbol, company_name, weight_pct, origin, proposal_id)
      values (pr.club_id, pr.symbol, pr.company_name, pr.to_weight_pct, 'Proposal · '||f||'-'||a, pr.id)
      on conflict (club_id, symbol) do update set weight_pct = excluded.weight_pct, origin = excluded.origin, proposal_id = excluded.proposal_id;
    end if;
    insert into fic_club_decisions(club_id, proposal_id, title, by_user, vote_result, believed)
      values (pr.club_id, pr.id, initcap(pr.kind)||' '||pr.symbol||' '||pr.from_weight_pct||'% → '||pr.to_weight_pct||'%', pr.author_id, f||'-'||a, pr.rationale);
  end if;
  return res;
end $$;

-- ── RLS: members read their club; authors write their own objects ────────
alter table fic_clubs enable row level security;
alter table fic_club_members enable row level security;
alter table fic_club_invites enable row level security;
alter table fic_club_picks enable row level security;
alter table fic_club_pick_reactions enable row level security;
alter table fic_club_pick_replies enable row level security;
alter table fic_club_proposals enable row level security;
alter table fic_club_votes enable row level security;
alter table fic_club_holdings enable row level security;
alter table fic_club_decisions enable row level security;
alter table fic_club_research enable row level security;
alter table fic_club_asks enable row level security;
alter table fic_brokerage_links enable row level security;

create policy "clubs: members or public" on fic_clubs for select using (privacy = 'public' or fic_is_club_member(id));
create policy "clubs: founder updates" on fic_clubs for update using (founder_id = auth.uid());
create policy "members: see own club" on fic_club_members for select using (fic_is_club_member(club_id));
create policy "invites: members" on fic_club_invites for all using (fic_is_club_member(club_id)) with check (fic_is_club_member(club_id));
create policy "picks: club or public" on fic_club_picks for select using (visibility = 'public' or (club_id is not null and fic_is_club_member(club_id)));
create policy "picks: author writes" on fic_club_picks for insert with check (author_id = auth.uid() and (club_id is null or fic_is_club_member(club_id)));
create policy "picks: author updates" on fic_club_picks for update using (author_id = auth.uid());
create policy "reactions: readable with pick" on fic_club_pick_reactions for select using (exists (select 1 from fic_club_picks p where p.id = pick_id and (p.visibility='public' or fic_is_club_member(p.club_id))));
create policy "reactions: own" on fic_club_pick_reactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "replies: readable with pick" on fic_club_pick_replies for select using (exists (select 1 from fic_club_picks p where p.id = pick_id and (p.visibility='public' or fic_is_club_member(p.club_id))));
create policy "replies: author" on fic_club_pick_replies for insert with check (author_id = auth.uid());
create policy "proposals: members" on fic_club_proposals for select using (fic_is_club_member(club_id));
create policy "proposals: author" on fic_club_proposals for insert with check (author_id = auth.uid() and fic_is_club_member(club_id));
create policy "votes: members read" on fic_club_votes for select using (exists (select 1 from fic_club_proposals r where r.id = proposal_id and fic_is_club_member(r.club_id)));
create policy "votes: own" on fic_club_votes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "holdings: members" on fic_club_holdings for select using (fic_is_club_member(club_id));
create policy "decisions: members" on fic_club_decisions for select using (fic_is_club_member(club_id));
create policy "research: members" on fic_club_research for select using (fic_is_club_member(club_id));
create policy "research: members write" on fic_club_research for insert with check (fic_is_club_member(club_id));
create policy "research: assignee/author update" on fic_club_research for update using (fic_is_club_member(club_id));
create policy "asks: members" on fic_club_asks for select using (fic_is_club_member(club_id));
create policy "asks: author" on fic_club_asks for insert with check (author_id = auth.uid() and fic_is_club_member(club_id));
create policy "brokerage: own" on fic_brokerage_links for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select on fic_club_activity to authenticated;
grant execute on function fic_create_club(text,text,text), fic_join_club(text), fic_is_club_member(uuid) to authenticated;
grant execute on function fic_resolve_proposal(uuid) to service_role;
