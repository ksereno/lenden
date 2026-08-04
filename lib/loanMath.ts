import type { Loan, LoanContribution, Payment } from "@/lib/types";

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

export function friendShares(
  loan: Loan,
  contributions: LoanContribution[],
  payments: Payment[],
): FriendShare[] {
  const totals = loanTotals(loan, payments);

  return contributions.map((c) => {
    const sharePercent = loan.principal > 0 ? c.amount / loan.principal : 0;
    return {
      friendId: c.friend_id,
      contribution: c.amount,
      sharePercent,
      interestEarned: sharePercent * totals.totalInterest,
      repaidToDate: sharePercent * totals.totalRepaid,
      outstanding: sharePercent * totals.balance,
    };
  });
}
