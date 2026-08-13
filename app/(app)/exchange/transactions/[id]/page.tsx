import Link from "next/link";
import { notFound } from "next/navigation";
import { getExchangeTransaction, getSharesForTransaction, getProfiles, getCoreFriends } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import {
  computeProfit,
  physicalAmount,
  digitalAmount,
  exchangeFee,
  titaAFee,
  distributableProfit,
  exchangeFriendShares,
  TITA_A_LABEL,
} from "@/lib/exchangeMath";
import { formatMoney, formatDate } from "@/lib/format";
import { FriendBadge } from "@/components/FriendBadge";
import { ExchangeStatusPill } from "@/components/ExchangeStatusPill";
import { StatCard } from "@/components/StatCard";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { setTransactionStatus, deleteTransaction } from "./actions";

export default async function TransactionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { id } = await params;
  const { error, message } = await searchParams;

  const tx = await getExchangeTransaction(id);
  if (!tx) notFound();

  const [shares, profiles, coreFriends, currentProfile] = await Promise.all([
    getSharesForTransaction(tx.id),
    getProfiles(),
    getCoreFriends(),
    getCurrentProfile(),
  ]);

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const isPoolFunded = tx.funding_source === "pool";
  const friendShares = exchangeFriendShares(tx, shares, coreFriends);

  const isOwner = currentProfile?.role === "owner";
  const hasShareOnThisTx = !!currentProfile && shares.some((s) => s.friend_id === currentProfile.id);
  const isCoreFriendOnPoolTx = isPoolFunded && currentProfile?.role === "contributor";
  const canEditThisTx = isOwner || hasShareOnThisTx || isCoreFriendOnPoolTx;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {tx.type === "cash_in" ? "Cash In" : "Cash Out"}
            {tx.counterparty_name && ` — ${tx.counterparty_name}`}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {formatDate(tx.date)}
            {tx.note && ` · ${tx.note}`}
            {" · "}
            <span className={isPoolFunded ? "text-accent" : undefined}>
              {isPoolFunded ? "shared pool" : "specific friends"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExchangeStatusPill status={tx.status} />
          {canEditThisTx && (
            <>
              <Link href={`/exchange/transactions/${tx.id}/edit`} className="text-sm text-muted hover:text-foreground">
                Edit
              </Link>
              <ConfirmDeleteButton
                action={deleteTransaction.bind(null, tx.id)}
                confirmMessage="Delete this transaction permanently? This also removes its profit-share breakdown."
                className="text-sm text-muted hover:text-red-400"
              >
                Delete
              </ConfirmDeleteButton>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {message || "Something went wrong."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Amount" value={formatMoney(tx.amount)} />
        <StatCard label="Fee (profit)" value={formatMoney(computeProfit(tx))} />
        <StatCard label="Physical leg" value={formatMoney(physicalAmount(tx))} />
        <StatCard label="Digital leg" value={formatMoney(digitalAmount(tx))} />
      </div>
      <p className="-mt-4 text-xs text-muted">
        Includes a {formatMoney(exchangeFee(tx))} exchange fee and a {formatMoney(titaAFee(tx))} cut to{" "}
        {TITA_A_LABEL} (10% each) — the friend shares below already reflect the remaining{" "}
        {formatMoney(distributableProfit(tx))}.
        {tx.fee_is_manual && " Fee was entered manually for this transaction."}
      </p>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">
          {isPoolFunded ? "Profit split (funded from the shared pool)" : "Profit split (manual)"}
        </h2>
        {friendShares.length === 0 ? (
          <p className="text-sm text-muted">No profit shares recorded.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Friend</th>
                  <th className="px-4 py-2 font-medium">Profit share</th>
                </tr>
              </thead>
              <tbody>
                {friendShares.map((s) => {
                  const p = profileById.get(s.friendId);
                  if (!p) return null;
                  return (
                    <tr key={s.friendId} className="border-t border-border">
                      <td className="px-4 py-2"><FriendBadge profile={p} /></td>
                      <td className="px-4 py-2 text-foreground">{formatMoney(s.profitShare)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canEditThisTx && tx.status !== "cancelled" && (
        <div className="flex gap-3">
          <form action={setTransactionStatus.bind(null, tx.id, "cancelled")}>
            <button type="submit" className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface">
              Cancel transaction
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
