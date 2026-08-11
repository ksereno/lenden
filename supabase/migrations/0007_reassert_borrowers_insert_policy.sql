-- Re-assert that contributors (not just the owner) can insert borrowers.
-- Written idempotently in case 0005 never actually landed on this project.
drop policy if exists borrowers_insert_owner on borrowers;
drop policy if exists borrowers_insert on borrowers;
create policy borrowers_insert on borrowers for insert to authenticated
  with check (app_role() in ('owner', 'contributor'));
