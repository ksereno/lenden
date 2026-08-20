import {
  getLoans,
  getAllPayments,
  getPoolDeposits,
  getPoolTransfers,
  getExchangeTransactions,
  getExchangeCapitalDeposits,
} from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { poolSummary } from "@/lib/loanMath";
import { exchangePoolBalance } from "@/lib/exchangeMath";
import { formatMoney, formatDate } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import type { Payment } from "@/lib/types";
import { createTransfer } from "./actions";

const DIRECTION_LABELS: Record<string, string> = {
  lending_to_exchange: "Lenden to Lenden X",
  exchange_to_lending: "Lenden X to Lenden",
};

export default async function TransferCapitalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  const [loans, allPayments, poolDeposits, transfers, exchangeTransactions, exchangeCapitalDeposits, currentProfile] =
    await Promise.all([
      getLoans(),
      getAllPayments(),
      getPoolDeposits(),
      getPoolTransfers(),
      getExchangeTransactions(),
      getExchangeCapitalDeposits(),
      getCurrentProfile(),
    ]);

  const paymentsByLoan = new Map<string, Payment[]>();
  for (const p of allPayments) {
    const list = paymentsByLoan.get(p.loan_id) ?? [];
    list.push(p);
    paymentsByLoan.set(p.loan_id, list);
  }

  const { available: lendenAvailable } = poolSummary(loans, paymentsByLoan, poolDeposits, transfers);
  const { totalAvailable: lendenXTotalPool } = exchangePoolBalance(
    exchangeTransactions,
    exchangeCapitalDeposits,
    transfers,
  );

  const canAct = currentProfile?.role === "owner" || currentProfile?.role === "contributor";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Transfer Capital</h1>
        <p className="mt-1 text-sm text-muted">Move money between Lenden and Lenden X.</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {message || "Something went wrong."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Lenden pool available" value={formatMoney(lendenAvailable)} />
        <StatCard label="Lenden X total pool" value={formatMoney(lendenXTotalPool)} />
      </div>

      {canAct && (
        <div className="max-w-sm">
          <h2 className="mb-3 text-sm font-medium text-muted">Log a transfer</h2>
          <form action={createTransfer} className="flex flex-col gap-3">
            <select
              name="direction"
              required
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            >
              <option value="lending_to_exchange">Lenden to Lenden X</option>
              <option value="exchange_to_lending">Lenden X to Lenden</option>
            </select>
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
              Log transfer
            </button>
          </form>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Transfer history</h2>
        {transfers.length === 0 ? (
          <p className="text-sm text-muted">No transfers logged yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Direction</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-4 py-2 text-foreground">{DIRECTION_LABELS[t.direction]}</td>
                    <td className="px-4 py-2 text-foreground">{formatMoney(t.amount)}</td>
                    <td className="px-4 py-2 text-muted">{formatDate(t.date)}</td>
                    <td className="px-4 py-2 text-muted">{t.note || "—"}</td>
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
