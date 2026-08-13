import Link from "next/link";
import {
  getExchangeTransactions,
  getAllExchangeTransactionShares,
  getProfiles,
  getCoreFriends,
} from "@/lib/queries";
import { exchangeFriendShares, exchangeFee, titaAFee, TITA_A_LABEL } from "@/lib/exchangeMath";
import { formatMoney, formatDate } from "@/lib/format";
import { FriendBadge } from "@/components/FriendBadge";
import { ExchangeStatusPill } from "@/components/ExchangeStatusPill";
import { StatCard } from "@/components/StatCard";
import type { ExchangeTransactionShare } from "@/lib/types";

export default async function ExchangeReportsPage() {
  const [transactions, allShares, profiles, coreFriends] = await Promise.all([
    getExchangeTransactions(),
    getAllExchangeTransactionShares(),
    getProfiles(),
    getCoreFriends(),
  ]);

  const sharesByTx = new Map<string, ExchangeTransactionShare[]>();
  for (const s of allShares) {
    const list = sharesByTx.get(s.transaction_id) ?? [];
    list.push(s);
    sharesByTx.set(s.transaction_id, list);
  }

  const byFriend = new Map(profiles.map((p) => [p.id, { profile: p, profitShare: 0 }]));
  let totalKatchFee = 0;
  let totalTitaAFee = 0;
  let totalProfit = 0;

  const activeTransactions = transactions.filter((t) => t.status !== "cancelled");

  for (const tx of activeTransactions) {
    const shares = exchangeFriendShares(tx, sharesByTx.get(tx.id) ?? [], coreFriends);
    for (const s of shares) {
      const agg = byFriend.get(s.friendId);
      if (!agg) continue;
      agg.profitShare += s.profitShare;
    }
    totalKatchFee += exchangeFee(tx);
    totalTitaAFee += titaAFee(tx);
    totalProfit += tx.fee;
  }

  const friendRows = [...byFriend.values()].filter(
    (r) => r.profile.role === "owner" || r.profile.role === "contributor",
  );

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted">Aggregate view across every friend and every transaction.</p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Off-the-top cuts</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total profit (all fees)" value={formatMoney(totalProfit)} />
          <StatCard label="Katch's exchange fee total" value={formatMoney(totalKatchFee)} />
          <StatCard label={`${TITA_A_LABEL}'s total`} value={formatMoney(totalTitaAFee)} />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-medium text-muted">By friend</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Friend</th>
                <th className="px-4 py-2 font-medium">Profit share</th>
              </tr>
            </thead>
            <tbody>
              {friendRows.map((row) => (
                <tr key={row.profile.id} className="border-t border-border">
                  <td className="px-4 py-2"><FriendBadge profile={row.profile} /></td>
                  <td className="px-4 py-2 text-foreground">{formatMoney(row.profitShare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">By transaction</h2>
        {transactions.length === 0 ? (
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
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-border">
                    <td className="px-4 py-2">
                      <Link href={`/exchange/transactions/${tx.id}`} className="text-foreground hover:text-accent">
                        {tx.type === "cash_in" ? "Cash In" : "Cash Out"}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-foreground">{formatMoney(tx.amount)}</td>
                    <td className="px-4 py-2 text-foreground">{formatMoney(tx.fee)}</td>
                    <td className="px-4 py-2 text-muted">{formatDate(tx.date)}</td>
                    <td className="px-4 py-2"><ExchangeStatusPill status={tx.status} /></td>
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
