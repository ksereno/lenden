import type { Loan, LoanContribution, Payment, PoolDeposit, PoolTransfer, Profile } from "@/lib/types";

/**
 * Total interest owed on a loan. Dispatches on interest_type so a new
 * calculation method can be added later without touching call sites.
 */
export function computeInterest(loan: Loan): number {
  switch (loan.interest_type) {
    case "flat":
      return loan.principal * (loan.interest_rate_percent / 100);
    default:
      throw new Error(`Unknown interest_type: ${loan.interest_type}`);
  }
}

/** Admin fee: a flat cut of the interest only, always credited to the
 * designated commission recipient regardless of who contributed principal,
 * and regardless of whether the loan was individually or pool funded. */
export const ADMIN_FEE_RATE = 0.1;

export function adminFee(loan: Loan): number {
  return computeInterest(loan) * ADMIN_FEE_RATE;
}

export interface LoanTotals {
  totalInterest: number;
  totalOwed: number;
  totalRepaid: number;
  balance: number;
}

export function loanTotals(loan: Loan, payments: Payment[]): LoanTotals {
  const totalInterest = computeInterest(loan);
  const totalOwed = loan.principal + totalInterest;
  const totalRepaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalOwed - totalRepaid;
  return { totalInterest, totalOwed, totalRepaid, balance };
}

export interface FriendShare {
  friendId: string;
  contribution: number;
  sharePercent: number;
  interestEarned: number;
  repaidToDate: number;
  outstanding: number;
}

/**
 * Per-friend breakdown of a loan's principal/interest.
 *
 * Individually-funded loans: proportional to each friend's actual
 * contribution (unchanged from the original model).
 *
 * Pool-funded loans: nobody personally contributed principal, so
 * contribution/outstanding/repaidToDate are all 0 -- only the interest
 * (after the admin fee) is real, split equally across `coreFriends`
 * (the fixed owner+contributor roster) regardless of deposit history.
 */
export function friendShares(
  loan: Loan,
  contributions: LoanContribution[],
  payments: Payment[],
  coreFriends: Profile[] = [],
): FriendShare[] {
  const totals = loanTotals(loan, payments);
  const distributableInterest = totals.totalInterest - adminFee(loan);

  if (loan.funding_source === "pool") {
    if (coreFriends.length === 0) return [];
    const equalInterest = distributableInterest / coreFriends.length;
    return coreFriends.map((f) => ({
      friendId: f.id,
      contribution: 0,
      sharePercent: 1 / coreFriends.length,
      interestEarned: equalInterest,
      repaidToDate: 0,
      outstanding: 0,
    }));
  }

  return contributions.map((c) => {
    const sharePercent = loan.principal > 0 ? c.amount / loan.principal : 0;
    return {
      friendId: c.friend_id,
      contribution: c.amount,
      sharePercent,
      interestEarned: sharePercent * distributableInterest,
      repaidToDate: sharePercent * totals.totalRepaid,
      outstanding: sharePercent * totals.balance,
    };
  });
}

export interface PoolSummary {
  totalDeposited: number;
  totalReturnedFromRepaid: number;
  currentlyLentFromPool: number;
  lostToDefaultedPool: number;
  netTransfersOut: number;
  available: number;
  totalPool: number;
}

/**
 * The shared pool's running balance. Any loan's full repayment (principal +
 * gross interest, regardless of whether it was individually or pool
 * funded) flows back into the pool -- only a pool-funded loan's principal
 * counts as "currently lent" or "lost to default" against it, since an
 * individually-funded loan's principal never came from the pool to begin
 * with. `transfers` moves value to/from LendenX's own pool -- money sent to
 * LendenX (`lending_to_exchange_*`) reduces what's available here, money
 * sent back (`exchange_*_to_lending`) increases it.
 */
export function poolSummary(
  loans: Loan[],
  paymentsByLoan: Map<string, Payment[]>,
  deposits: PoolDeposit[],
  transfers: PoolTransfer[] = [],
): PoolSummary {
  const totalDeposited = deposits.reduce((sum, d) => sum + d.amount, 0);

  let totalReturnedFromRepaid = 0;
  let currentlyLentFromPool = 0;
  let lostToDefaultedPool = 0;

  for (const loan of loans) {
    if (loan.status === "cancelled") continue;
    const payments = paymentsByLoan.get(loan.id) ?? [];
    const totals = loanTotals(loan, payments);

    if (loan.status === "repaid") {
      totalReturnedFromRepaid += totals.totalOwed;
    } else if (loan.funding_source === "pool" && loan.status === "open") {
      currentlyLentFromPool += loan.principal;
    } else if (loan.funding_source === "pool" && loan.status === "defaulted") {
      lostToDefaultedPool += loan.principal;
    }
  }

  let netTransfersOut = 0;
  for (const t of transfers) {
    if (t.direction === "lending_to_exchange_physical" || t.direction === "lending_to_exchange_digital") {
      netTransfersOut += t.amount;
    } else {
      netTransfersOut -= t.amount;
    }
  }

  const available =
    totalDeposited + totalReturnedFromRepaid - currentlyLentFromPool - lostToDefaultedPool - netTransfersOut;
  const totalPool = available + currentlyLentFromPool;

  return {
    totalDeposited,
    totalReturnedFromRepaid,
    currentlyLentFromPool,
    lostToDefaultedPool,
    netTransfersOut,
    available,
    totalPool,
  };
}
