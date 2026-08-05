import Link from "next/link";
import { redirect } from "next/navigation";
import { getLoans, getBorrowers, getAllPayments } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { loanTotals, adminFee } from "@/lib/loanMath";
import { formatMoney, formatDate } from "@/lib/format";
import { StatCard } from "@/components/StatCard";

export default async function CommissionsPage() {
  const profile = await getCurrentProfile();
  if (!profile || !(profile.receives_admin_fee || profile.role === "owner")) redirect("/");

  const [loans, borrowers, allPayments] = await Promise.all([
    getLoans(),
    getBorrowers(),
    getAllPayments(),
  ]);

  const borrowerById = new Map(borrowers.map((b) => [b.id, b]));

  const rows = loans.map((loan) => {
    const payments = allPayments.filter((p) => p.loan_id === loan.id);
    const totals = loanTotals(loan, payments);
    const fee = adminFee(loan);
    const received = loan.status === "repaid";
    return { loan, borrower: borrowerById.get(loan.borrower_id), totals, fee, received };
  });

  const totalCommission = rows.reduce((sum, r) => sum + r.fee, 0);
  const received = rows.reduce((sum, r) => sum + (r.received ? r.fee : 0), 0);
  const pending = totalCommission - received;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Commissions</h1>
        <p className="mt-1 text-sm text-muted">10% admin fee on interest, across every loan.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total commission" value={formatMoney(totalCommission)} />
        <StatCard label="Received" value={formatMoney(received)} />
        <StatCard label="Pending" value={formatMoney(pending)} />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">No loans yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Borrower</th>
                <th className="px-4 py-2 font-medium">Interest</th>
                <th className="px-4 py-2 font-medium">Commission (10%)</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ loan, borrower, totals, fee, received }) => (
                <tr key={loan.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    <Link href={`/loans/${loan.id}`} className="text-foreground hover:text-accent">
                      {borrower?.name ?? "Unknown"}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-foreground">{formatMoney(totals.totalInterest)}</td>
                  <td className="px-4 py-2 text-foreground">{formatMoney(fee)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        received ? "bg-green-500/15 text-green-400" : "bg-accent/15 text-accent"
                      }`}
                    >
                      {received ? "Received" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
