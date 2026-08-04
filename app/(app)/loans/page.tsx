import Link from "next/link";
import { getLoans, getBorrowers, getAllPayments } from "@/lib/queries";
import { loanTotals } from "@/lib/loanMath";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";

export default async function LoansPage() {
  const [loans, borrowers, allPayments] = await Promise.all([
    getLoans(),
    getBorrowers(),
    getAllPayments(),
  ]);

  const borrowerById = new Map(borrowers.map((b) => [b.id, b]));
  const today = new Date().toISOString().slice(0, 10);

  const rows = loans.map((loan) => {
    const payments = allPayments.filter((p) => p.loan_id === loan.id);
    const isOverdue = loan.status === "open" && !!loan.due_date && loan.due_date < today;
    return { loan, borrower: borrowerById.get(loan.borrower_id), totals: loanTotals(loan, payments), isOverdue };
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Loans</h1>
        <p className="mt-1 text-sm text-muted">Every loan, regardless of status.</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">No loans yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Borrower</th>
                <th className="px-4 py-2 font-medium">Principal</th>
                <th className="px-4 py-2 font-medium">Balance</th>
                <th className="px-4 py-2 font-medium">Due</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ loan, borrower, totals, isOverdue }) => (
                <tr key={loan.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    <Link href={`/loans/${loan.id}`} className="text-foreground hover:text-accent">
                      {borrower?.name ?? "Unknown"}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-foreground">{formatMoney(loan.principal)}</td>
                  <td className="px-4 py-2 text-foreground">{formatMoney(totals.balance)}</td>
                  <td className={`px-4 py-2 ${isOverdue ? "text-red-400" : "text-muted"}`}>
                    {loan.due_date ? formatDate(loan.due_date) : "—"}
                    {isOverdue && " (overdue)"}
                  </td>
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
  );
}
