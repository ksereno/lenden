import { notFound, redirect } from "next/navigation";
import { getExchangeTransaction, getSharesForTransaction } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { updateTransaction, deleteTransaction, setTransactionStatus } from "../actions";

export default async function EditTransactionPage({
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

  const [profile, shares] = await Promise.all([getCurrentProfile(), getSharesForTransaction(tx.id)]);

  const canEdit =
    profile?.role === "owner" ||
    (tx.funding_source === "pool" && profile?.role === "contributor") ||
    (!!profile && shares.some((s) => s.friend_id === profile.id));
  if (!canEdit) redirect(`/exchange/transactions/${id}`);

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Edit transaction</h1>
        <p className="mt-1 text-xs text-muted">
          Amount and fee can&apos;t be edited here — only counterparty, date, note, and status.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {message || "Something went wrong."}
        </p>
      )}

      <form action={updateTransaction.bind(null, tx.id)} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Counterparty name</span>
          <input
            type="text"
            name="counterparty_name"
            defaultValue={tx.counterparty_name}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Date</span>
          <input
            type="date"
            name="date"
            required
            defaultValue={tx.date}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Note</span>
          <input
            type="text"
            name="note"
            defaultValue={tx.note}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Status</span>
          <select
            name="status"
            defaultValue={tx.status}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
          >
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <button
          type="submit"
          className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Save changes
        </button>
      </form>

      <div className="flex gap-3 border-t border-border pt-6">
        {tx.status !== "cancelled" && (
          <ConfirmDeleteButton
            action={setTransactionStatus.bind(null, tx.id, "cancelled")}
            confirmMessage="Cancel this transaction? It stays on record marked as cancelled, and is left out of all totals, but nothing is deleted."
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface"
          >
            Cancel transaction
          </ConfirmDeleteButton>
        )}
        <ConfirmDeleteButton
          action={deleteTransaction.bind(null, tx.id)}
          confirmMessage="Delete this transaction permanently? This also removes its profit-share breakdown — this cannot be undone."
          className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
        >
          Delete transaction
        </ConfirmDeleteButton>
      </div>
    </div>
  );
}
