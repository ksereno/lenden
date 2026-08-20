import Link from "next/link";
import {
  getExchangeTransactions,
  getExchangeCapitalDeposits,
  getPoolTransfers,
  getProfiles,
} from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { exchangePoolBalance, exchangeVolume } from "@/lib/exchangeMath";
import { formatMoney, formatDate } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { ExchangeStatusPill } from "@/components/ExchangeStatusPill";
import { FriendBadge } from "@/components/FriendBadge";

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
  const { profit, totalAvailable } = exchangePoolBalance(transactions, capitalDeposits, transfers);
  const { totalCashIn, totalCashOut } = exchangeVolume(transactions);
  const poolTransactions = transactions.filter((t) => t.funding_source === "pool" && t.status !== "cancelled");
  const canAct = currentProfile?.role === "owner" || currentProfile?.role === "contributor";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Pool</h1>
        <p className="mt-1 text-sm text-muted">
          Profit from every transaction, plus whatever&apos;s been deposited as shared capital.{" "}
          <Link href="/transfer" className="text-accent hover:opacity-80">
            Manage transfers with Lenden →
          </Link>
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
        <h2 className="mb-3 text-sm font-medium text-muted">Volume</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Total Cash In" value={formatMoney(totalCashIn)} />
          <StatCard label="Total Cash Out" value={formatMoney(totalCashOut)} />
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
    </div>
  );
}
