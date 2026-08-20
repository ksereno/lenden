-- Distinguishes a genuine friend capital contribution (no profit
-- implication -- see the "Add funds" warning) from other earned income
-- that isn't tied to a cash-in/cash-out transaction (e.g. mobile load
-- top-up margins) but should still count toward LendenX's Profit figure.
-- Written idempotently, safe to re-run.
alter table exchange_capital_deposits
  add column if not exists source text not null default 'contribution'
  check (source in ('contribution', 'other_income'));
