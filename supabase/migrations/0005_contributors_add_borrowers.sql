drop policy borrowers_insert_owner on borrowers;
create policy borrowers_insert on borrowers for insert to authenticated
  with check (app_role() in ('owner', 'contributor'));
