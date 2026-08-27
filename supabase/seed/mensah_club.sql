-- Seed: The Mensah Family Investing Club for Kway (kcoffie90@gmail.com). Idempotent.
-- Other members are created as auth users only if they don't exist (invite-only placeholders).
do $$
declare kway uuid; c uuid; mem record; andwele uuid; arielle uuid; mom uuid; dad uuid; p uuid;
begin
  select id into kway from auth.users where email = 'kcoffie90@gmail.com';
  if kway is null then raise exception 'Kway user not found'; end if;

  select id into c from fic_clubs where founder_id = kway and short_name = 'The Mensah Club';
  if c is null then
    insert into fic_clubs(name, short_name, kind, privacy, founder_id, invite_code, investing_night)
      values ('The Mensah Family Investing Club','The Mensah Club','family','private',kway,'MENSAH-23','{"when":"Thu 7 PM","topic":"Costco presentations"}') returning id into c;
  end if;
  insert into fic_club_members(club_id,user_id,role) values (c,kway,'founder') on conflict do nothing;

  -- placeholder members (no login until invited)
  for mem in select * from (values ('andwele@mensah.club','Andwele','member',false),('arielle@mensah.club','Arielle','child',true),('mom@mensah.club','Mom','admin',false),('dad@mensah.club','Dad','admin',false)) as t(email,name,role,gated) loop
    insert into auth.users(id,instance_id,email,aud,role,encrypted_password,email_confirmed_at,raw_user_meta_data,created_at,updated_at)
      values (gen_random_uuid(),'00000000-0000-0000-0000-000000000000',mem.email,'authenticated','authenticated','', null, jsonb_build_object('display_name',mem.name,'placeholder',true), now(), now())
      on conflict (email) do nothing;
    insert into fic_club_members(club_id,user_id,role,vote_gated,gate_reason)
      select c, u.id, mem.role, mem.gated, case when mem.gated then 'needs the "What is energy?" mini-lesson before her vote counts' end from auth.users u where u.email = mem.email
      on conflict do nothing;
  end loop;
  select id into andwele from auth.users where email='andwele@mensah.club';
  select id into arielle from auth.users where email='arielle@mensah.club';
  select id into mom from auth.users where email='mom@mensah.club';
  select id into dad from auth.users where email='dad@mensah.club';

  -- holdings
  insert into fic_club_holdings(club_id,symbol,company_name,weight_pct,origin) values
    (c,'VOO','S&P 500 ETF',40,'Proposal #1 · unanimous'),(c,'NVDA','Nvidia',12,'From Andwele''s Pick → Idea → vote 3-1'),
    (c,'CEG','Constellation',4,'Added Tue · from Sarah''s public idea'),(c,'AAPL','Apple',10,'Proposal #2 · 4-0'),
    (c,'KO','Coca-Cola',8,'Mom''s dividend pick → vote 4-0'),(c,'DIS','Disney',6,'Arielle''s pick → vote 3-1')
  on conflict do nothing;

  -- picks
  if not exists (select 1 from fic_club_picks where club_id=c and symbol='NVDA' and author_id=andwele) then
    insert into fic_club_picks(club_id,author_id,symbol,company_name,stance,reason,horizon,confidence,price_at_pick,created_at) values
      (c,andwele,'NVDA','NVIDIA Corp.','buy','Their chips are in everything AI. Every data center being built needs them.','3y',3,1204,now()-interval '2 hours'),
      (c,andwele,'AAPL','Apple Inc.','buy','Services money is the quiet giant.','5y+',4,224.1,now()-interval '3 days'),
      (c,mom,'COST','Costco Wholesale','watch','Membership renewals at 93% — that''s the moat.','3y',3,1071.5,now()-interval '7 days');
    select id into p from fic_club_picks where club_id=c and symbol='NVDA' and author_id=andwele;
    insert into fic_club_pick_replies(pick_id,author_id,body,created_at) values
      (p,mom,'Love the company — but what about the price? Aren''t we paying a lot for what it earns?',now()-interval '1 hour'),
      (p,dad,'P/E is ~60 vs. 35 for the market. Fast growers can earn it — that''s the bet.',now()-interval '40 minutes');
    insert into fic_club_pick_reactions(pick_id,user_id,kind) values (p,mom,'not_sure'),(p,dad,'agree'),(p,kway,'agree') on conflict do nothing;
  end if;

  -- open proposal
  if not exists (select 1 from fic_club_proposals where club_id=c and symbol='CEG' and status='open') then
    insert into fic_club_proposals(club_id,author_id,kind,symbol,company_name,from_weight_pct,to_weight_pct,rationale,evidence,concept_gate,closes_at,created_at)
      values (c,dad,'resize','CEG','Constellation Energy',4,8,'Nuclear supply deals with data centers keep landing. Our 4% starter position is up 18% and the thesis got stronger.',
        '[{"label":"IDEA: NUCLEAR ENERGY","href":"/club/idea/nuclear-next-decade"},{"label":"MOM''S RESEARCH","href":"/club/research"}]',
        '{"concept":"position sizing","minutes":3,"href":"/learn/path/build-a-portfolio"}', now()+interval '2 days', now()-interval '2 days') returning id into p;
    insert into fic_club_votes(proposal_id,user_id,vote) values (p,andwele,'for'),(p,mom,'for'),(p,dad,'for') on conflict do nothing;
  end if;

  -- journal
  insert into fic_club_decisions(club_id,decided_on,title,by_user,vote_result,believed,wrong_if,review)
    select c,'2026-08-24','Bought CEG 4%',dad,'4-0','AI needs baseload power.','deals stall.','Nov earnings.'
    where not exists (select 1 from fic_club_decisions where club_id=c and title='Bought CEG 4%');
  insert into fic_club_decisions(club_id,decided_on,title,vote_result,learned)
    select c,'2026-07-12','Trimmed NVDA 15→12%','3-1','single-stock concentration. All 4 finished the lesson 🎓'
    where not exists (select 1 from fic_club_decisions where club_id=c and title='Trimmed NVDA 15→12%');

  -- research
  insert into fic_club_research(club_id,symbol,company_name,assignee_id,reason,due_label,status,notes)
    select c,'COST','Costco Wholesale',kway,'Everyone we know shops there','before Family Night · Thursday 7 PM','open',null
    where not exists (select 1 from fic_club_research where club_id=c and symbol='COST' and assignee_id=kway);
  insert into fic_club_research(club_id,symbol,company_name,assignee_id,reason,due_label,status,notes)
    select c,'COST','Costco Wholesale',mom,'Membership economics','done','ready','Membership renewals at 93% — that''s the moat.'
    where not exists (select 1 from fic_club_research where club_id=c and symbol='COST' and assignee_id=mom);
  insert into fic_club_research(club_id,symbol,company_name,assignee_id,reason,due_label,status)
    select c,'AMZN','Amazon',arielle,'Dad wants your opinion','due Thu','open'
    where not exists (select 1 from fic_club_research where club_id=c and symbol='AMZN');
end $$;
