import Link from "next/link";
import { getExchangeTransactions, getAllExchangeTransactionShares } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { formatMoney, formatDate } from "@/lib/format";
import { ExchangeStatusPill } from "@/components/ExchangeStatusPill";

export default async function ExchangeTransactionsPage() {
  const [transactions, allShares, currentProfile] = await Promise.all([
    getExchangeTransactions(),
    getAllExchangeTransactionShares(),
    getCurrentProfile(),
  ]);

  const isOwner = currentProfile?.role === "owner";

  const rows = transactions.map((tx) => {
    const canEdit =
      isOwner ||
      (tx.funding_source === "pool" && currentProfile?.role === "contributor") ||
      (!!currentProfile && allShares.some((s) => s.transaction_id === tx.id && s.friend_id === currentProfile.id));
    return { tx, canEdit };
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Transactions</h1>
        <p className="mt-1 text-sm text-muted">Every cash in / cash out transaction, regardless of status.</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">No transactions yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Counterparty</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Fee</th>
                <th className="px-4 py-2 font-medium">Funding</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ tx, canEdit }) => (
                <tr key={tx.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    <Link href={`/exchange/transactions/${tx.id}`} className="text-foreground hover:text-accent">
                      {tx.type === "cash_in" ? "Cash In" : "Cash Out"}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted">{tx.counterparty_name || "—"}</td>
                  <td className="px-4 py-2 text-foreground">{formatMoney(tx.amount)}</td>
                  <td className="px-4 py-2 text-foreground">{formatMoney(tx.fee)}</td>
                  <td className="px-4 py-2 text-muted">{tx.funding_source === "pool" ? "Pool" : "Individual"}</td>
                  <td className="px-4 py-2 text-muted">{formatDate(tx.date)}</td>
                  <td className="px-4 py-2">
                    <ExchangeStatusPill status={tx.status} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    {canEdit && (
                      <Link
                        href={`/exchange/transactions/${tx.id}/edit`}
                        aria-label="Edit transaction"
                        title="You can edit this transaction"
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
