-- Admin fee recipient flag
alter table profiles add column receives_admin_fee boolean not null default false;

-- Loans: any owner/contributor can create; edit/delete restricted to the
-- owner or whoever actually contributed to that specific loan.
drop policy loans_insert_owner on loans;
create policy loans_insert on loans for insert to authenticated
  with check (app_role() in ('owner', 'contributor'));

drop policy loans_update_owner on loans;
create policy loans_update on loans for update to authenticated
  using (
    app_role() = 'owner'
    or exists (
      select 1 from loan_contributions lc
      where lc.loan_id = loans.id and lc.friend_id = auth.uid()
    )
  );

drop policy loans_delete_owner on loans;
create policy loans_delete on loans for delete to authenticated
  using (
    app_role() = 'owner'
    or exists (
      select 1 from loan_contributions lc
      where lc.loan_id = loans.id and lc.friend_id = auth.uid()
    )
  );
