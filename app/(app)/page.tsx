import Link from "next/link";
import { getLoans, getBorrowers, getAllPayments } from "@/lib/queries";
import { loanTotals } from "@/lib/loanMath";
import { formatMoney } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { StatusPill } from "@/components/StatusPill";

export default async function DashboardPage() {
  const [loans, borrowers, allPayments] = await Promise.all([
    getLoans(),
    getBorrowers(),
    getAllPayments(),
  ]);

  const borrowerById = new Map(borrowers.map((b) => [b.id, b]));

  const rows = loans.map((loan) => {
    const payments = allPayments.filter((p) => p.loan_id === loan.id);
    return { loan, borrower: borrowerById.get(loan.borrower_id), totals: loanTotals(loan, payments) };
  });

  const totalLent = rows.reduce((sum, r) => sum + r.loan.principal, 0);
  const totalInterest = rows.reduce((sum, r) => sum + r.totals.totalInterest, 0);
  const totalOutstanding = rows.reduce((sum, r) => sum + Math.max(r.totals.balance, 0), 0);

  const openLoans = rows.filter((r) => r.loan.status === "open");

  return (
    <div className="flex flex-col gap-8">
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
        <h2 className="mb-3 text-sm font-medium text-muted">Open loans</h2>
        {openLoans.length === 0 ? (
          <p className="text-sm text-muted">No open loans yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
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
