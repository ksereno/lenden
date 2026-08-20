import Link from "next/link";
import {
  getExchangeTransactions,
  getExchangeCapitalDeposits,
  getPoolTransfers,
  getCoreFriends,
} from "@/lib/queries";
import { exchangePoolBalance } from "@/lib/exchangeMath";
import { formatMoney } from "@/lib/format";
import { FriendBadge } from "@/components/FriendBadge";
import type { ExchangeTransactionType, FundingSource } from "@/lib/types";
import { createExchangeTransaction } from "./actions";

const FEE_TIERS_TEXT =
  "Fee: ≤₱299 → ₱10 · ₱300–599 → ₱15 · ₱600–1,000 → ₱20 · then +₱20 per additional full ₱1,000.";

export async function NewTransactionForm({
  type,
  fundingSource,
  searchParams,
}: {
  type: ExchangeTransactionType;
  fundingSource: FundingSource;
  searchParams: {
    error?: string;
    needed?: string;
    available?: string;
    message?: string;
    success?: string;
    amount?: string;
    fee?: string;
  };
}) {
  const {
    error,
    needed,
    available: availableParam,
    message,
    success,
    amount: savedAmount,
    fee: savedFee,
  } = searchParams;
  const typeLabel = type === "cash_in" ? "Cash In" : "Cash Out";
  const backHref = `/exchange/transactions/new/${type === "cash_in" ? "cash-in" : "cash-out"}`;
  const today = new Date().toISOString().slice(0, 10);

  let poolBalanceLine: React.ReactNode = null;
  if (fundingSource === "pool") {
    const [transactions, capitalDeposits, transfers] = await Promise.all([
      getExchangeTransactions(),
      getExchangeCapitalDeposits(),
      getPoolTransfers(),
    ]);
    const { physicalBalance, digitalBalance } = exchangePoolBalance(transactions, capitalDeposits, transfers);
    const available = type === "cash_in" ? digitalBalance : physicalBalance;
    poolBalanceLine = (
      <p className="mt-3 text-sm text-foreground">
        Available {type === "cash_in" ? "digital" : "physical"} balance:{" "}
        <span className="font-medium">{formatMoney(available)}</span>
      </p>
    );
  }

  const coreFriends = fundingSource === "individual" ? await getCoreFriends() : [];

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <div>
        <Link href={backHref} className="mb-2 inline-block text-xs text-muted hover:text-foreground">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-foreground">
          {typeLabel} — {fundingSource === "pool" ? "Shared Pool" : "Specific Friends"}
        </h1>
        <p className="mt-1 text-sm text-muted">{FEE_TIERS_TEXT}</p>
        {poolBalanceLine}
      </div>

      {success === "1" && (
        <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
          Logged — {formatMoney(Number(savedAmount ?? 0))}, fee {formatMoney(Number(savedFee ?? 0))}. Ready for the
          next one.
        </p>
      )}
      {error === "invalid" && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {message || "Enter a valid amount and date."}
        </p>
      )}
      {error === "insufficient" && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          That&apos;s more than the pool has available — you asked for {formatMoney(Number(needed ?? 0))} but
          only {formatMoney(Number(availableParam ?? 0))} is available. Lower the amount, or fund this
          transaction from specific friends instead.
        </p>
      )}
      {error === "create-failed" && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          Couldn&apos;t create the transaction: {message || "unknown error"}
        </p>
      )}

      <form action={createExchangeTransaction.bind(null, type, fundingSource)} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Amount</span>
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0.01"
            required
            autoFocus
            placeholder="0.00"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Manual fee override (optional)</span>
          <input
            type="number"
            name="manual_fee"
            step="0.01"
            min="0"
            placeholder="Leave blank to auto-calculate from the fee schedule"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Counterparty name (optional)</span>
          <input
            type="text"
            name="counterparty_name"
            placeholder="Customer name"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Date</span>
          <input
            type="date"
            name="date"
            required
            defaultValue={today}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Note (optional)</span>
          <input
            type="text"
            name="note"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </label>

        {fundingSource === "individual" && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm text-muted">
              Profit share per friend (manual, after Katch&apos;s and Tita A&apos;s cuts)
            </legend>
            {coreFriends.map((f) => (
              <label key={f.id} className="flex items-center justify-between gap-3 text-sm">
                <FriendBadge profile={f} />
                <input
                  type="number"
                  name={`profit_share_${f.id}`}
                  step="0.01"
                  placeholder="0.00"
                  className="w-32 rounded-lg border border-border bg-surface px-3 py-1.5 text-right text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </label>
            ))}
          </fieldset>
        )}

        <button
          type="submit"
          className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Create transaction
        </button>
      </form>
    </div>
  );
}
