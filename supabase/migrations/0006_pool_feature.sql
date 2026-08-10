-- Loans can now be funded either by specific friends directly, or drawn
-- from the group's shared pool (interest splits equally among everyone
-- in the pool case).
alter table loans add column funding_source text not null default 'individual'
  check (funding_source in ('individual', 'pool'));

create table pool_deposits (
  id uuid primary key default gen_random_uuid(),
  friend_id uuid not null references profiles(id),
  amount numeric(12, 2) not null check (amount > 0),
  date date not null default current_date,
  note text not null default '',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table pool_deposits enable row level security;

create policy pool_deposits_select on pool_deposits for select to authenticated using (true);
create policy pool_deposits_insert on pool_deposits for insert to authenticated
  with check (app_role() in ('owner', 'contributor'));
create policy pool_deposits_update_owner on pool_deposits for update to authenticated using (app_role() = 'owner');
create policy pool_deposits_delete_owner on pool_deposits for delete to authenticated using (app_role() = 'owner');

-- Pool-funded loans have no loan_contributions rows (nobody personally
-- funded them), so the existing "contributor on this loan" edit rule
-- would otherwise lock everyone but the owner out. Any core friend can
-- manage a pool loan collectively.
drop policy loans_update on loans;
create policy loans_update on loans for update to authenticated
  using (
    app_role() = 'owner'
    or (funding_source = 'pool' and app_role() = 'contributor')
    or exists (
      select 1 from loan_contributions lc
      where lc.loan_id = loans.id and lc.friend_id = auth.uid()
    )
  );

drop policy loans_delete on loans;
create policy loans_delete on loans for delete to authenticated
  using (
    app_role() = 'owner'
    or (funding_source = 'pool' and app_role() = 'contributor')
    or exists (
      select 1 from loan_contributions lc
      where lc.loan_id = loans.id and lc.friend_id = auth.uid()
    )
  );
