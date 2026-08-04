-- Lenden schema: profiles, borrowers, loans, contributions, payments + RLS.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'viewer' check (role in ('owner', 'contributor', 'viewer')),
  highlight_color text not null default '#A8A69D',
  created_at timestamptz not null default now()
);

create table borrowers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_info text not null default '',
  notes text not null default '',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table loans (
  id uuid primary key default gen_random_uuid(),
  borrower_id uuid not null references borrowers(id),
  principal numeric(12, 2) not null check (principal > 0),
  interest_rate_percent numeric(6, 3) not null check (interest_rate_percent >= 0),
  interest_type text not null default 'flat' check (interest_type in ('flat')),
  date_issued date not null default current_date,
  term_description text not null default '',
  status text not null default 'open' check (status in ('open', 'repaid', 'defaulted')),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table loan_contributions (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  friend_id uuid not null references profiles(id),
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  date_received date not null default current_date,
  note text not null default '',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- Auto-create a profile (defaulting to viewer) whenever someone signs in via magic link.
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Role lookup helper, security definer so it isn't blocked by profiles' own RLS.
create function current_role()
returns text
language sql
security definer set search_path = public
stable
as $$
  select role from profiles where id = auth.uid();
$$;

alter table profiles enable row level security;
alter table borrowers enable row level security;
alter table loans enable row level security;
alter table loan_contributions enable row level security;
alter table payments enable row level security;

-- profiles: everyone signed in can see the roster (names/colors); only the owner edits roles.
create policy profiles_select on profiles for select to authenticated using (true);
create policy profiles_update_owner on profiles for update to authenticated using (current_role() = 'owner');
create policy profiles_delete_owner on profiles for delete to authenticated using (current_role() = 'owner');

-- borrowers: everyone can view; only the owner manages them.
create policy borrowers_select on borrowers for select to authenticated using (true);
create policy borrowers_insert_owner on borrowers for insert to authenticated with check (current_role() = 'owner');
create policy borrowers_update_owner on borrowers for update to authenticated using (current_role() = 'owner');
create policy borrowers_delete_owner on borrowers for delete to authenticated using (current_role() = 'owner');

-- loans: everyone can view; only the owner manages them.
create policy loans_select on loans for select to authenticated using (true);
create policy loans_insert_owner on loans for insert to authenticated with check (current_role() = 'owner');
create policy loans_update_owner on loans for update to authenticated using (current_role() = 'owner');
create policy loans_delete_owner on loans for delete to authenticated using (current_role() = 'owner');

-- loan_contributions: everyone can view; owner and contributors can add, nobody but owner edits/deletes.
create policy contributions_select on loan_contributions for select to authenticated using (true);
create policy contributions_insert on loan_contributions for insert to authenticated
  with check (current_role() in ('owner', 'contributor'));
create policy contributions_update_owner on loan_contributions for update to authenticated using (current_role() = 'owner');
create policy contributions_delete_owner on loan_contributions for delete to authenticated using (current_role() = 'owner');

-- payments: everyone can view; owner and contributors can log payments, nobody but owner edits/deletes.
create policy payments_select on payments for select to authenticated using (true);
create policy payments_insert on payments for insert to authenticated
  with check (current_role() in ('owner', 'contributor'));
create policy payments_update_owner on payments for update to authenticated using (current_role() = 'owner');
create policy payments_delete_owner on payments for delete to authenticated using (current_role() = 'owner');
