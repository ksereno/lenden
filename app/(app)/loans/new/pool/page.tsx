import Link from "next/link";
import { redirect } from "next/navigation";
import { getBorrowers, getLoans, getAllPayments, getPoolDeposits } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { poolSummary } from "@/lib/loanMath";
import { formatMoney } from "@/lib/format";
import type { Payment } from "@/lib/types";
import { createPoolLoan } from "./actions";

export default async function NewPoolLoanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; needed?: string; available?: string; message?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "owner" && profile?.role !== "contributor") redirect("/");

  const { error, needed, available: availableParam, message } = await searchParams;

  const [borrowers, loans, allPayments, deposits] = await Promise.all([
    getBorrowers(),
    getLoans(),
    getAllPayments(),
    getPoolDeposits(),
  ]);
  const paymentsByLoan = new Map<string, Payment[]>();
  for (const p of allPayments) {
    const list = paymentsByLoan.get(p.loan_id) ?? [];
    list.push(p);
    paymentsByLoan.set(p.loan_id, list);
  }
  const { available } = poolSummary(loans, paymentsByLoan, deposits);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <div>
        <Link href="/loans/new" className="mb-2 inline-block text-xs text-muted hover:text-foreground">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Funded from the shared pool</h1>
        <p className="mt-1 text-sm text-muted">
          Interest earned splits equally among Kean, Jess, Marcel, Katch, and Efren.
        </p>
        <p className="mt-3 text-sm text-foreground">
          Available in pool: <span className="font-medium">{formatMoney(available)}</span>
        </p>
      </div>

      {error === "insufficient" && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          That&apos;s more than the pool has available — you asked for {formatMoney(Number(needed ?? 0))} but
          only {formatMoney(Number(availableParam ?? 0))} is available. Lower the amount, or fund this loan
          from specific friends instead.
        </p>
      )}
      {error === "create-failed" && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          Couldn&apos;t create the loan: {message || "unknown error"}
        </p>
      )}

      {borrowers.length === 0 ? (
        <p className="text-sm text-muted">
          No borrowers yet — <Link href="/borrowers" className="text-accent">add one first</Link>.
        </p>
      ) : (
        <form action={createPoolLoan} className="flex flex-col gap-5">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Borrower</span>
            <select
              name="borrower_id"
              required
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            >
              {borrowers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Amount to lend</span>
            <input
              type="number"
              name="principal"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Flat interest rate (%)</span>
            <input
              type="number"
              name="interest_rate_percent"
              step="0.01"
              min="0"
              required
              defaultValue={5}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Date issued</span>
            <input
              type="date"
              name="date_issued"
              required
              defaultValue={today}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Due date (optional)</span>
            <input
              type="date"
              name="due_date"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Term (optional)</span>
            <input
              type="text"
              name="term_description"
              placeholder="e.g. due in 3 months"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </label>

          <button
            type="submit"
            className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            Create loan
          </button>
        </form>
      )}
    </div>
  );
}
