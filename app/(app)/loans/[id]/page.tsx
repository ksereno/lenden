import { notFound } from "next/navigation";
import { getLoan, getBorrower, getContributionsForLoan, getPaymentsForLoan, getProfiles } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { loanTotals, friendShares } from "@/lib/loanMath";
import { formatMoney, formatPercent, formatDate } from "@/lib/format";
import { FriendBadge } from "@/components/FriendBadge";
import { StatusPill } from "@/components/StatusPill";
import { StatCard } from "@/components/StatCard";
import { addPayment, setLoanStatus } from "./actions";

export default async function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const loan = await getLoan(id);
  if (!loan) notFound();

  const [borrower, contributions, payments, profiles, currentProfile] = await Promise.all([
    getBorrower(loan.borrower_id),
    getContributionsForLoan(loan.id),
    getPaymentsForLoan(loan.id),
    getProfiles(),
    getCurrentProfile(),
  ]);

  const totals = loanTotals(loan, payments);
  const shares = friendShares(loan, contributions, payments);
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const isOwner = currentProfile?.role === "owner";
  const canAddPayment = currentProfile?.role === "owner" || currentProfile?.role === "contributor";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{borrower?.name ?? "Unknown borrower"}</h1>
          <p className="mt-1 text-sm text-muted">
            {loan.interest_rate_percent}% flat · issued {formatDate(loan.date_issued)}
            {loan.term_description && ` · ${loan.term_description}`}
          </p>
        </div>
        <StatusPill status={loan.status} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Principal" value={formatMoney(loan.principal)} />
        <StatCard label="Total interest" value={formatMoney(totals.totalInterest)} />
        <StatCard label="Repaid so far" value={formatMoney(totals.totalRepaid)} />
        <StatCard label="Balance" value={formatMoney(totals.balance)} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Contributions</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Friend</th>
                <th className="px-4 py-2 font-medium">Contributed</th>
                <th className="px-4 py-2 font-medium">Share</th>
                <th className="px-4 py-2 font-medium">Interest earned</th>
                <th className="px-4 py-2 font-medium">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {shares.map((s) => {
                const p = profileById.get(s.friendId);
                if (!p) return null;
                return (
                  <tr key={s.friendId} className="border-t border-border">
                    <td className="px-4 py-2"><FriendBadge profile={p} /></td>
                    <td className="px-4 py-2 text-foreground">{formatMoney(s.contribution)}</td>
                    <td className="px-4 py-2 text-muted">{formatPercent(s.sharePercent)}</td>
                    <td className="px-4 py-2 text-foreground">{formatMoney(s.interestEarned)}</td>
                    <td className="px-4 py-2 text-foreground">{formatMoney(s.outstanding)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Payment history</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted">No payments logged yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-2 text-foreground">{formatDate(p.date_received)}</td>
                    <td className="px-4 py-2 text-foreground">{formatMoney(p.amount)}</td>
                    <td className="px-4 py-2 text-muted">{p.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canAddPayment && (
        <div className="max-w-sm">
          <h2 className="mb-3 text-sm font-medium text-muted">Log a payment</h2>
          <form action={addPayment.bind(null, loan.id)} className="flex flex-col gap-3">
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0.01"
              required
              placeholder="Amount"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <input
              type="date"
              name="date_received"
              required
              defaultValue={today}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
            <input
              type="text"
              name="note"
              placeholder="Note (optional)"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              className="self-start rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
            >
              Add payment
            </button>
          </form>
        </div>
      )}

      {isOwner && loan.status === "open" && (
        <div className="flex gap-3">
          <form action={setLoanStatus.bind(null, loan.id, "repaid")}>
            <button type="submit" className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface">
              Mark repaid
            </button>
          </form>
          <form action={setLoanStatus.bind(null, loan.id, "defaulted")}>
            <button type="submit" className="rounded-lg border border-border px-3 py-1.5 text-sm text-red-400 hover:bg-surface">
              Mark defaulted
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
