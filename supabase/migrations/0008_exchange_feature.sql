-- LendenX: a cash-in/cash-out exchange business run by the same 5 friends,
-- added as a new section alongside Lenden's lending business. Two
-- independent flat cuts apply to every transaction's fee (= profit) before
-- the friend split: 10% to whichever profile has receives_exchange_fee
-- (mirrors receives_admin_fee), and 10% to "Tita A" -- an external,
-- non-group recipient computed in lib/exchangeMath.ts with no DB row (no
-- auth.users FK possible for her). Written idempotently, safe to re-run in
-- full regardless of what already succeeded from a previous partial run.

alter table profiles add column if not exists receives_exchange_fee boolean not null default false;

create table if not exists exchange_transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('cash_in', 'cash_out')),
  funding_source text not null default 'individual' check (funding_source in ('individual', 'pool')),
  amount numeric(12, 2) not null check (amount > 0),
  fee numeric(12, 2) not null,
  fee_is_manual boolean not null default false,
  counterparty_name text not null default '',
  date date not null default current_date,
  note text not null default '',
  status text not null default 'completed' check (status in ('completed', 'cancelled')),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- Individual-funded transactions only: each contributing friend's manually
-- entered peso profit share (post-both-cuts). Deliberately not derived from
-- any contributed-capital amount -- individual-funded exchange transactions
-- never draw from a tracked capital pool per friend.
create table if not exists exchange_transaction_shares (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references exchange_transactions(id) on delete cascade,
  friend_id uuid not null references profiles(id),
  profit_share numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists exchange_capital_deposits (
  id uuid primary key default gen_random_uuid(),
  friend_id uuid not null references profiles(id),
  balance_type text not null check (balance_type in ('physical', 'digital')),
  amount numeric(12, 2) not null check (amount > 0),
  date date not null default current_date,
  note text not null default '',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- Moves value between Lenden's lending pool and LendenX's physical/digital
-- balances, in either direction. Read by both poolSummary() (lib/loanMath.ts)
-- and exchangePoolBalance() (lib/exchangeMath.ts).
create table if not exists pool_transfers (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (
    direction in (
      'lending_to_exchange_physical',
      'lending_to_exchange_digital',
      'exchange_physical_to_lending',
      'exchange_digital_to_lending'
    )
  ),
  amount numeric(12, 2) not null check (amount > 0),
  date date not null default current_date,
  note text not null default '',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table exchange_transactions enable row level security;
alter table exchange_transaction_shares enable row level security;
alter table exchange_capital_deposits enable row level security;
alter table pool_transfers enable row level security;

-- exchange_transactions: everyone views; owner/contributor insert; edit/
-- delete restricted to owner, OR a contributor on a pool-funded transaction,
-- OR a friend who has a share row on that transaction -- exact mirror of
-- the loans_update/loans_delete policy shape.
drop policy if exists exchange_transactions_select on exchange_transactions;
create policy exchange_transactions_select on exchange_transactions for select to authenticated using (true);

drop policy if exists exchange_transactions_insert on exchange_transactions;
create policy exchange_transactions_insert on exchange_transactions for insert to authenticated
  with check (app_role() in ('owner', 'contributor'));

drop policy if exists exchange_transactions_update on exchange_transactions;
create policy exchange_transactions_update on exchange_transactions for update to authenticated
  using (
    app_role() = 'owner'
    or (funding_source = 'pool' and app_role() = 'contributor')
    or exists (
      select 1 from exchange_transaction_shares s
      where s.transaction_id = exchange_transactions.id and s.friend_id = auth.uid()
    )
  );

drop policy if exists exchange_transactions_delete on exchange_transactions;
create policy exchange_transactions_delete on exchange_transactions for delete to authenticated
  using (
    app_role() = 'owner'
    or (funding_source = 'pool' and app_role() = 'contributor')
    or exists (
      select 1 from exchange_transaction_shares s
      where s.transaction_id = exchange_transactions.id and s.friend_id = auth.uid()
    )
  );

-- exchange_transaction_shares: everyone views; owner/contributor insert;
-- only owner edits/deletes directly (mirrors loan_contributions).
drop policy if exists exchange_transaction_shares_select on exchange_transaction_shares;
create policy exchange_transaction_shares_select on exchange_transaction_shares for select to authenticated using (true);

drop policy if exists exchange_transaction_shares_insert on exchange_transaction_shares;
create policy exchange_transaction_shares_insert on exchange_transaction_shares for insert to authenticated
  with check (app_role() in ('owner', 'contributor'));

drop policy if exists exchange_transaction_shares_update_owner on exchange_transaction_shares;
create policy exchange_transaction_shares_update_owner on exchange_transaction_shares for update to authenticated using (app_role() = 'owner');

drop policy if exists exchange_transaction_shares_delete_owner on exchange_transaction_shares;
create policy exchange_transaction_shares_delete_owner on exchange_transaction_shares for delete to authenticated using (app_role() = 'owner');

-- exchange_capital_deposits: mirrors pool_deposits exactly.
drop policy if exists exchange_capital_deposits_select on exchange_capital_deposits;
create policy exchange_capital_deposits_select on exchange_capital_deposits for select to authenticated using (true);

drop policy if exists exchange_capital_deposits_insert on exchange_capital_deposits;
create policy exchange_capital_deposits_insert on exchange_capital_deposits for insert to authenticated
  with check (app_role() in ('owner', 'contributor'));

drop policy if exists exchange_capital_deposits_update_owner on exchange_capital_deposits;
create policy exchange_capital_deposits_update_owner on exchange_capital_deposits for update to authenticated using (app_role() = 'owner');

drop policy if exists exchange_capital_deposits_delete_owner on exchange_capital_deposits;
create policy exchange_capital_deposits_delete_owner on exchange_capital_deposits for delete to authenticated using (app_role() = 'owner');

-- pool_transfers: same shape as pool_deposits -- owner/contributor can log a
-- transfer, only owner edits/deletes.
drop policy if exists pool_transfers_select on pool_transfers;
create policy pool_transfers_select on pool_transfers for select to authenticated using (true);

drop policy if exists pool_transfers_insert on pool_transfers;
create policy pool_transfers_insert on pool_transfers for insert to authenticated
  with check (app_role() in ('owner', 'contributor'));

drop policy if exists pool_transfers_update_owner on pool_transfers;
create policy pool_transfers_update_owner on pool_transfers for update to authenticated using (app_role() = 'owner');

drop policy if exists pool_transfers_delete_owner on pool_transfers;
create policy pool_transfers_delete_owner on pool_transfers for delete to authenticated using (app_role() = 'owner');
