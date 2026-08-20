import Link from "next/link";
import {
  getExchangeTransactions,
  getExchangeCapitalDeposits,
  getPoolTransfers,
  getProfiles,
} from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { exchangePoolBalance } from "@/lib/exchangeMath";
import { formatMoney, formatDate } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { ExchangeStatusPill } from "@/components/ExchangeStatusPill";
import { FriendBadge } from "@/components/FriendBadge";
import { createTransfer } from "./actions";

const DIRECTION_LABELS: Record<string, string> = {
  lending_to_exchange_physical: "Lenden pool → LendenX physical",
  lending_to_exchange_digital: "Lenden pool → LendenX digital",
  exchange_physical_to_lending: "LendenX physical → Lenden pool",
  exchange_digital_to_lending: "LendenX digital → Lenden pool",
};

export default async function ExchangePoolPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  const [transactions, capitalDeposits, transfers, profiles, currentProfile] = await Promise.all([
    getExchangeTransactions(),
    getExchangeCapitalDeposits(),
    getPoolTransfers(),
    getProfiles(),
    getCurrentProfile(),
  ]);

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const { physicalBalance, digitalBalance, profit, totalAvailable } = exchangePoolBalance(
    transactions,
    capitalDeposits,
    transfers,
  );
  const poolTransactions = transactions.filter((t) => t.funding_source === "pool" && t.status !== "cancelled");
  const canAct = currentProfile?.role === "owner" || currentProfile?.role === "contributor";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Pool</h1>
        <p className="mt-1 text-sm text-muted">
          Profit from every transaction, plus whatever&apos;s been deposited as shared capital.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {message || "Something went wrong."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Profit" value={formatMoney(profit)} />
        <StatCard label="Total pool available" value={formatMoney(totalAvailable)} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">On hand right now</h2>
        <p className="mb-3 text-xs text-muted">
          The amount used to fund a cash-in/cash-out cycles between these two — it&apos;s not extra money on top
          of the pool above.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Physical" value={formatMoney(physicalBalance)} />
          <StatCard label="Digital" value={formatMoney(digitalBalance)} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Pool-funded transactions</h2>
        {poolTransactions.length === 0 ? (
          <p className="text-sm text-muted">No pool-funded transactions yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Fee</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {poolTransactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-border">
                    <td className="px-4 py-2">
                      <Link href={`/exchange/transactions/${tx.id}`} className="text-foreground hover:text-accent">
                        {tx.type === "cash_in" ? "Cash In" : "Cash Out"}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-foreground">{formatMoney(tx.amount)}</td>
                    <td className="px-4 py-2 text-foreground">{formatMoney(tx.fee)}</td>
                    <td className="px-4 py-2 text-muted">{formatDate(tx.date)}</td>
                    <td className="px-4 py-2">
                      <ExchangeStatusPill status={tx.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">
          Capital deposit history
          {canAct && (
            <>
              {" "}
              — <Link href="/exchange/pool/add-funds" className="text-accent hover:opacity-80">add funds</Link>
            </>
          )}
        </h2>
        {capitalDeposits.length === 0 ? (
          <p className="text-sm text-muted">No deposits logged yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Friend</th>
                  <th className="px-4 py-2 font-medium">Balance</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {capitalDeposits.map((d) => {
                  const p = profileById.get(d.friend_id);
                  return (
                    <tr key={d.id} className="border-t border-border">
                      <td className="px-4 py-2">{p ? <FriendBadge profile={p} /> : "Unknown"}</td>
                      <td className="px-4 py-2 text-muted capitalize">{d.balance_type}</td>
                      <td className="px-4 py-2 text-muted">
                        {d.source === "other_income" ? "Other income" : "Contribution"}
                      </td>
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

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Transfers with Lenden</h2>
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

      {canAct && (
        <div className="max-w-sm">
          <h2 className="mb-3 text-sm font-medium text-muted">Transfer capital</h2>
          <form action={createTransfer} className="flex flex-col gap-3">
            <select
              name="direction"
              required
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            >
              <option value="lending_to_exchange_physical">Lenden pool → LendenX physical</option>
              <option value="lending_to_exchange_digital">Lenden pool → LendenX digital</option>
              <option value="exchange_physical_to_lending">LendenX physical → Lenden pool</option>
              <option value="exchange_digital_to_lending">LendenX digital → Lenden pool</option>
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
    </div>
  );
}
