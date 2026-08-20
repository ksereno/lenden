import Link from "next/link";
import {
  getExchangeTransactions,
  getExchangeCapitalDeposits,
  getPoolTransfers,
  getAllExchangeTransactionShares,
  getCoreFriends,
} from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { exchangePoolBalance, exchangeFriendShares, exchangeFee } from "@/lib/exchangeMath";
import { formatMoney, formatDate } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { ExchangeStatusPill } from "@/components/ExchangeStatusPill";
import type { ExchangeTransactionShare } from "@/lib/types";

export default async function ExchangeDashboardPage() {
  const [transactions, capitalDeposits, transfers, allShares, coreFriends, currentProfile] = await Promise.all([
    getExchangeTransactions(),
    getExchangeCapitalDeposits(),
    getPoolTransfers(),
    getAllExchangeTransactionShares(),
    getCoreFriends(),
    getCurrentProfile(),
  ]);

  const { physicalBalance, digitalBalance, profit, totalAvailable } = exchangePoolBalance(
    transactions,
    capitalDeposits,
    transfers,
  );

  const sharesByTx = new Map<string, ExchangeTransactionShare[]>();
  for (const s of allShares) {
    const list = sharesByTx.get(s.transaction_id) ?? [];
    list.push(s);
    sharesByTx.set(s.transaction_id, list);
  }

  let totalCombinedEarnings = 0;
  let yourEarnings = 0;
  let yourExchangeFee = 0;
  for (const tx of transactions) {
    if (tx.status === "cancelled") continue;
    const shares = exchangeFriendShares(tx, sharesByTx.get(tx.id) ?? [], coreFriends);
    for (const s of shares) {
      totalCombinedEarnings += s.profitShare;
      if (currentProfile && s.friendId === currentProfile.id) yourEarnings += s.profitShare;
    }
    if (currentProfile?.receives_exchange_fee) yourExchangeFee += exchangeFee(tx);
  }

  const recentTransactions = transactions.filter((t) => t.status !== "cancelled").slice(0, 10);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-xl font-semibold text-foreground">LendenX</h1>
        <p className="mt-1 text-sm text-muted">Cash in / cash out exchange.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Profit" value={formatMoney(profit)} />
        <StatCard label="Total pool available" value={formatMoney(totalAvailable)} />
      </div>
      <p className="-mt-6 text-xs text-muted">
        The amount used to fund a cash-in/cash-out just cycles between physical and digital — it&apos;s never
        retained on its own. Only the fee stays in the account as profit.
      </p>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">On hand right now</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Physical" value={formatMoney(physicalBalance)} />
          <StatCard label="Digital" value={formatMoney(digitalBalance)} />
          <StatCard label="Total transactions" value={String(transactions.filter((t) => t.status !== "cancelled").length)} />
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-sm font-medium text-muted">
          Earnings — <Link href="/exchange/reports" className="text-accent hover:opacity-80">view everyone</Link>
        </h2>
        <p className="mb-3 text-xs text-muted">
          Total combined doesn&apos;t include Katch&apos;s or Tita A&apos;s off-the-top cuts.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total combined earnings" value={formatMoney(totalCombinedEarnings)} />
          {currentProfile && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted">Your earnings</div>
              <div className="mt-1 text-xl font-semibold text-foreground">
                {formatMoney(yourEarnings + yourExchangeFee)}
              </div>
              {currentProfile.receives_exchange_fee && (
                <div className="mt-1 text-xs text-muted">
                  {formatMoney(yourEarnings)} share + {formatMoney(yourExchangeFee)} exchange fee
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Recent transactions</h2>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-muted">No transactions yet.</p>
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
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-border hover:bg-surface">
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
    </div>
  );
}
