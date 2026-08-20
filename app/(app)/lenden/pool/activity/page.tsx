import Link from "next/link";
import { getLoans, getBorrowers, getAllPayments, getPoolDeposits, getProfiles, getPoolTransfers } from "@/lib/queries";
import { poolActivity, poolSummary } from "@/lib/loanMath";
import { formatMoney, formatDate } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import type { Payment } from "@/lib/types";

export default async function PoolActivityPage() {
  const [loans, borrowers, allPayments, deposits, profiles, transfers] = await Promise.all([
    getLoans(),
    getBorrowers(),
    getAllPayments(),
    getPoolDeposits(),
    getProfiles(),
    getPoolTransfers(),
  ]);

  const borrowerById = new Map(borrowers.map((b) => [b.id, b]));
  const friendById = new Map(profiles.map((p) => [p.id, p]));
  const paymentsByLoan = new Map<string, Payment[]>();
  for (const p of allPayments) {
    const list = paymentsByLoan.get(p.loan_id) ?? [];
    list.push(p);
    paymentsByLoan.set(p.loan_id, list);
  }

  const events = poolActivity(loans, borrowerById, paymentsByLoan, deposits, friendById, transfers);
  const summary = poolSummary(loans, paymentsByLoan, deposits, transfers);

  const rows = events.reduce<Array<(typeof events)[number] & { runningTotal: number }>>((acc, e) => {
    const previousTotal = acc.length > 0 ? acc[acc.length - 1].runningTotal : 0;
    acc.push({ ...e, runningTotal: previousTotal + e.amount });
    return acc;
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/lenden/pool" className="mb-2 inline-block text-xs text-muted hover:text-foreground">
          ← Back to Pool
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Pool activity</h1>
        <p className="mt-1 text-sm text-muted">
          Every event that has added to or taken from the Lenden pool, in order, with a running balance —
          the last row should match &ldquo;Available&rdquo; below.
        </p>
      </div>

      <div className="max-w-xs">
        <StatCard label="Available (current)" value={formatMoney(summary.available)} />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        <strong className="text-foreground">Why a repaid loan sometimes adds more than expected:</strong> when any
        loan is marked <em>Repaid</em> — even one that specific friends funded, not the pool — the full amount
        (what was lent out plus the interest) gets credited back to the pool. That&apos;s intentional: it&apos;s how
        repaid money becomes available for the next pool loan. It just means a repaid loan can bump the pool up by
        more than you&apos;d expect if you were only counting pool-funded loans.
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">No activity yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">What happened</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Running balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-2 text-muted whitespace-nowrap">
                    {formatDate(r.date)}
                    {r.approximateDate && <span title="Exact date not tracked — shown by loan issue date">*</span>}
                  </td>
                  <td className="px-4 py-2 text-foreground">{r.description}</td>
                  <td className={`px-4 py-2 font-medium ${r.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {r.amount >= 0 ? "+" : "−"}
                    {formatMoney(Math.abs(r.amount))}
                  </td>
                  <td className="px-4 py-2 text-foreground">{formatMoney(r.runningTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted">
        * Repaid/defaulted dates aren&apos;t tracked precisely (no timestamp is recorded for when the status
        changed) — shown under the loan&apos;s issue date as the closest approximation.
      </p>
    </div>
  );
}
