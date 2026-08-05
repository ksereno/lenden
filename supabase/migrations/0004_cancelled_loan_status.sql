alter table loans drop constraint loans_status_check;
alter table loans add constraint loans_status_check
  check (status in ('open', 'repaid', 'defaulted', 'cancelled'));
