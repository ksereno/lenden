import Link from "next/link";
import { getLoans, getBorrowers, getAllPayments, getAllContributions } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { loanTotals } from "@/lib/loanMath";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";

export default async function LoansPage() {
  const [loans, borrowers, allPayments, allContributions, currentProfile] = await Promise.all([
    getLoans(),
    getBorrowers(),
    getAllPayments(),
    getAllContributions(),
    getCurrentProfile(),
  ]);

  const borrowerById = new Map(borrowers.map((b) => [b.id, b]));
  const today = new Date().toISOString().slice(0, 10);
  const isOwner = currentProfile?.role === "owner";

  const rows = loans.map((loan) => {
    const payments = allPayments.filter((p) => p.loan_id === loan.id);
    const isOverdue = loan.status === "open" && !!loan.due_date && loan.due_date < today;
    const canEdit =
      isOwner ||
      (loan.funding_source === "pool" && currentProfile?.role === "contributor") ||
      (!!currentProfile &&
        allContributions.some((c) => c.loan_id === loan.id && c.friend_id === currentProfile.id));
    return { loan, borrower: borrowerById.get(loan.borrower_id), totals: loanTotals(loan, payments), isOverdue, canEdit };
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
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ loan, borrower, totals, isOverdue, canEdit }) => (
                <tr key={loan.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    <Link href={`/lenden/loans/${loan.id}`} className="text-foreground hover:text-accent">
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
                  <td className="px-4 py-2 text-right">
                    {canEdit && (
                      <Link
                        href={`/lenden/loans/${loan.id}/edit`}
                        aria-label="Edit loan"
                        title="You can edit this loan"
                        className="inline-flex items-center gap-1 text-muted hover:text-accent"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M11.3 1.7a1.5 1.5 0 0 1 2.1 2.1l-7.8 7.8-2.8.7.7-2.8 7.8-7.8Z"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Edit
                      </Link>
                    )}
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
