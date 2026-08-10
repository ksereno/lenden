import Link from "next/link";
import { getLoans, getBorrowers, getAllPayments, getPoolDeposits, getProfiles } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { poolSummary, loanTotals } from "@/lib/loanMath";
import { formatMoney, formatDate } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { StatusPill } from "@/components/StatusPill";
import { FriendBadge } from "@/components/FriendBadge";
import type { Payment } from "@/lib/types";
import { addDeposit } from "./actions";

export default async function PoolPage() {
  const [loans, borrowers, allPayments, deposits, profiles, currentProfile] = await Promise.all([
    getLoans(),
    getBorrowers(),
    getAllPayments(),
    getPoolDeposits(),
    getProfiles(),
    getCurrentProfile(),
  ]);

  const borrowerById = new Map(borrowers.map((b) => [b.id, b]));
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const paymentsByLoan = new Map<string, Payment[]>();
  for (const p of allPayments) {
    const list = paymentsByLoan.get(p.loan_id) ?? [];
    list.push(p);
    paymentsByLoan.set(p.loan_id, list);
  }

  const summary = poolSummary(loans, paymentsByLoan, deposits);
  const poolLoans = loans.filter((l) => l.funding_source === "pool" && l.status !== "cancelled");
  const canAct = currentProfile?.role === "owner" || currentProfile?.role === "contributor";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Pool</h1>
        <p className="mt-1 text-sm text-muted">The group&apos;s shared lending fund.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total pool" value={formatMoney(summary.totalPool)} />
        <StatCard label="Available" value={formatMoney(summary.available)} />
        <StatCard label="Currently lent (from pool)" value={formatMoney(summary.currentlyLentFromPool)} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Pool-funded loans</h2>
        {poolLoans.length === 0 ? (
          <p className="text-sm text-muted">No pool-funded loans yet.</p>
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
                {poolLoans.map((loan) => {
                  const totals = loanTotals(loan, paymentsByLoan.get(loan.id) ?? []);
                  return (
                    <tr key={loan.id} className="border-t border-border">
                      <td className="px-4 py-2">
                        <Link href={`/loans/${loan.id}`} className="text-foreground hover:text-accent">
                          {borrowerById.get(loan.borrower_id)?.name ?? "Unknown"}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-foreground">{formatMoney(loan.principal)}</td>
                      <td className="px-4 py-2 text-foreground">{formatMoney(totals.balance)}</td>
                      <td className="px-4 py-2">
                        <StatusPill status={loan.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Deposit history</h2>
        {deposits.length === 0 ? (
          <p className="text-sm text-muted">No deposits logged yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Friend</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((d) => {
                  const p = profileById.get(d.friend_id);
                  return (
                    <tr key={d.id} className="border-t border-border">
                      <td className="px-4 py-2">{p ? <FriendBadge profile={p} /> : "Unknown"}</td>
                      <td className="px-4 py-2 text-foreground">{formatMoney(d.amount)}</td>
                      <td className="px-4 py-2 text-muted">{formatDate(d.date)}</td>
                      <td className="px-4 py-2 text-muted">{d.note || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canAct && (
        <div className="max-w-sm">
          <h2 className="mb-3 text-sm font-medium text-muted">Log a deposit</h2>
          <form action={addDeposit} className="flex flex-col gap-3">
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
              name="date"
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
              Log deposit
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
