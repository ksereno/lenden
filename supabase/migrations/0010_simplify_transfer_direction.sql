-- Capital transfers between Lenden and Lenden X no longer distinguish
-- physical vs digital -- only the Total Pool value matters. Collapses the
-- 4-value direction down to 2. Written idempotently, safe to re-run.

alter table pool_transfers drop constraint if exists pool_transfers_direction_check;

update pool_transfers
set direction = 'lending_to_exchange'
where direction in ('lending_to_exchange_physical', 'lending_to_exchange_digital');

update pool_transfers
set direction = 'exchange_to_lending'
where direction in ('exchange_physical_to_lending', 'exchange_digital_to_lending');

alter table pool_transfers
  add constraint pool_transfers_direction_check
  check (direction in ('lending_to_exchange', 'exchange_to_lending'));
