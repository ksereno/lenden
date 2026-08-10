-- Loans can now be funded either by specific friends directly, or drawn
-- from the group's shared pool (interest splits equally among everyone
-- in the pool case). Written to be safe to re-run in full regardless of
-- what already succeeded from a previous partial run.
alter table loans add column if not exists funding_source text not null default 'individual'
  check (funding_source in ('individual', 'pool'));

create table if not exists pool_deposits (
  id uuid primary key default gen_random_uuid(),
  friend_id uuid not null references profiles(id),
  amount numeric(12, 2) not null check (amount > 0),
  date date not null default current_date,
  note text not null default '',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table pool_deposits enable row level security;

drop policy if exists pool_deposits_select on pool_deposits;
create policy pool_deposits_select on pool_deposits for select to authenticated using (true);

drop policy if exists pool_deposits_insert on pool_deposits;
create policy pool_deposits_insert on pool_deposits for insert to authenticated
  with check (app_role() in ('owner', 'contributor'));

drop policy if exists pool_deposits_update_owner on pool_deposits;
create policy pool_deposits_update_owner on pool_deposits for update to authenticated using (app_role() = 'owner');

drop policy if exists pool_deposits_delete_owner on pool_deposits;
create policy pool_deposits_delete_owner on pool_deposits for delete to authenticated using (app_role() = 'owner');

-- Pool-funded loans have no loan_contributions rows (nobody personally
-- funded them), so the existing "contributor on this loan" edit rule
-- would otherwise lock everyone but the owner out. Any core friend can
-- manage a pool loan collectively.
drop policy if exists loans_update on loans;
create policy loans_update on loans for update to authenticated
  using (
    app_role() = 'owner'
    or (funding_source = 'pool' and app_role() = 'contributor')
    or exists (
      select 1 from loan_contributions lc
      where lc.loan_id = loans.id and lc.friend_id = auth.uid()
    )
  );

drop policy if exists loans_delete on loans;
create policy loans_delete on loans for delete to authenticated
  using (
    app_role() = 'owner'
    or (funding_source = 'pool' and app_role() = 'contributor')
    or exists (
      select 1 from loan_contributions lc
      where lc.loan_id = loans.id and lc.friend_id = auth.uid()
    )
  );
