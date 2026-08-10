import Link from "next/link";
import {
  getLoans,
  getBorrowers,
  getAllPayments,
  getAllContributions,
  getPoolDeposits,
  getCoreFriends,
} from "@/lib/queries";
import { loanTotals, poolSummary, friendShares, adminFee } from "@/lib/loanMath";
import { formatMoney } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { StatusPill } from "@/components/StatusPill";
import { getCurrentProfile } from "@/lib/currentProfile";
import type { LoanContribution, Payment } from "@/lib/types";

export default async function DashboardPage() {
  const [loans, borrowers, allPayments, allContributions, deposits, coreFriends, currentProfile] =
    await Promise.all([
      getLoans(),
      getBorrowers(),
      getAllPayments(),
      getAllContributions(),
      getPoolDeposits(),
      getCoreFriends(),
      getCurrentProfile(),
    ]);

  const borrowerById = new Map(borrowers.map((b) => [b.id, b]));

  const rows = loans.map((loan) => {
    const payments = allPayments.filter((p) => p.loan_id === loan.id);
    return { loan, borrower: borrowerById.get(loan.borrower_id), totals: loanTotals(loan, payments) };
  });

  const activeRows = rows.filter((r) => r.loan.status !== "cancelled");
  const totalLent = activeRows.reduce((sum, r) => sum + r.loan.principal, 0);
  const totalInterest = activeRows.reduce((sum, r) => sum + r.totals.totalInterest, 0);
  const totalOutstanding = activeRows.reduce((sum, r) => sum + Math.max(r.totals.balance, 0), 0);

  const openLoans = rows.filter((r) => r.loan.status === "open");

  const paymentsByLoan = new Map<string, Payment[]>();
  for (const p of allPayments) {
    const list = paymentsByLoan.get(p.loan_id) ?? [];
    list.push(p);
    paymentsByLoan.set(p.loan_id, list);
  }
  const contributionsByLoan = new Map<string, LoanContribution[]>();
  for (const c of allContributions) {
    const list = contributionsByLoan.get(c.loan_id) ?? [];
    list.push(c);
    contributionsByLoan.set(c.loan_id, list);
  }

  const pool = poolSummary(loans, paymentsByLoan, deposits);

  const earningsByFriend = new Map(coreFriends.map((f) => [f.id, 0]));
  let totalCombinedEarnings = 0;
  for (const loan of loans) {
    if (loan.status === "cancelled") continue;
    const shares = friendShares(
      loan,
      contributionsByLoan.get(loan.id) ?? [],
      paymentsByLoan.get(loan.id) ?? [],
      coreFriends,
    );
    for (const s of shares) {
      earningsByFriend.set(s.friendId, (earningsByFriend.get(s.friendId) ?? 0) + s.interestEarned);
      totalCombinedEarnings += s.interestEarned;
    }
  }

  const totalAdminFee = loans
    .filter((l) => l.status !== "cancelled")
    .reduce((sum, l) => sum + adminFee(l), 0);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Overview across every loan in the pool.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total lent" value={formatMoney(totalLent)} />
        <StatCard label="Total interest accrued" value={formatMoney(totalInterest)} />
        <StatCard label="Total outstanding" value={formatMoney(totalOutstanding)} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">
          Pool — <Link href="/pool" className="text-accent hover:opacity-80">view details</Link>
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total pool" value={formatMoney(pool.totalPool)} />
          <StatCard label="Available" value={formatMoney(pool.available)} />
          <StatCard label="Currently lent (from pool)" value={formatMoney(pool.currentlyLentFromPool)} />
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-sm font-medium text-muted">
          Earnings — <Link href="/reports" className="text-accent hover:opacity-80">view everyone</Link>
        </h2>
        <p className="mb-3 text-xs text-muted">
          Total combined doesn&apos;t include Efren&apos;s admin fee.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total combined earnings" value={formatMoney(totalCombinedEarnings)} />
          {currentProfile && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted">Your earnings</div>
              {(() => {
                const interest = earningsByFriend.get(currentProfile.id) ?? 0;
                const isAdminFeeRecipient = currentProfile.receives_admin_fee;
                const total = isAdminFeeRecipient ? interest + totalAdminFee : interest;
                return (
                  <>
                    <div className="mt-1 text-xl font-semibold text-foreground">{formatMoney(total)}</div>
                    {isAdminFeeRecipient && (
                      <div className="mt-1 text-xs text-muted">
                        {formatMoney(interest)} interest + {formatMoney(totalAdminFee)} admin fee
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Open loans</h2>
        {openLoans.length === 0 ? (
          <p className="text-sm text-muted">No open loans yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Borrower</th>
                  <th className="px-4 py-2 font-medium">Principal</th>
                  <th className="px-4 py-2 font-medium">Balance</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {openLoans.map(({ loan, borrower, totals }) => (
                  <tr key={loan.id} className="border-t border-border hover:bg-surface">
                    <td className="px-4 py-2">
                      <Link href={`/loans/${loan.id}`} className="text-foreground hover:text-accent">
                        {borrower?.name ?? "Unknown"}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-foreground">{formatMoney(loan.principal)}</td>
                    <td className="px-4 py-2 text-foreground">{formatMoney(totals.balance)}</td>
                    <td className="px-4 py-2">
                      <StatusPill status={loan.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
