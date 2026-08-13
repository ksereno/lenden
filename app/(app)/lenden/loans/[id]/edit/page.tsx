import { notFound, redirect } from "next/navigation";
import { getLoan, getBorrower, getContributionsForLoan } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { updateLoan, deleteLoan, setLoanStatus } from "../actions";

export default async function EditLoanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const loan = await getLoan(id);
  if (!loan) notFound();

  const [profile, contributions, borrower] = await Promise.all([
    getCurrentProfile(),
    getContributionsForLoan(loan.id),
    getBorrower(loan.borrower_id),
  ]);

  const canEdit =
    profile?.role === "owner" ||
    (loan.funding_source === "pool" && profile?.role === "contributor") ||
    (!!profile && contributions.some((c) => c.friend_id === profile.id));
  if (!canEdit) redirect(`/lenden/loans/${id}`);

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Edit loan</h1>
        <p className="mt-1 text-sm text-muted">{borrower?.name}</p>
        <p className="mt-1 text-xs text-muted">
          Principal (₱{loan.principal.toFixed(2)}) and contributions can&apos;t be edited here — only terms and status.
        </p>
      </div>

      <form action={updateLoan.bind(null, loan.id)} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Flat interest rate (%)</span>
          <input
            type="number"
            name="interest_rate_percent"
            step="0.01"
            min="0"
            required
            defaultValue={loan.interest_rate_percent}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Date issued</span>
          <input
            type="date"
            name="date_issued"
            required
            defaultValue={loan.date_issued}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Due date</span>
          <input
            type="date"
            name="due_date"
            defaultValue={loan.due_date ?? ""}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Term (optional)</span>
          <input
            type="text"
            name="term_description"
            defaultValue={loan.term_description}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Status</span>
          <select
            name="status"
            defaultValue={loan.status}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
          >
            <option value="open">Open</option>
            <option value="repaid">Repaid</option>
            <option value="defaulted">Defaulted</option>
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
        {loan.status !== "cancelled" && (
          <ConfirmDeleteButton
            action={setLoanStatus.bind(null, loan.id, "cancelled")}
            confirmMessage="Cancel this loan? It stays on record marked as cancelled, and is left out of interest/commission totals, but nothing is deleted."
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface"
          >
            Cancel loan
          </ConfirmDeleteButton>
        )}
        <ConfirmDeleteButton
          action={deleteLoan.bind(null, loan.id)}
          confirmMessage="Delete this loan permanently? This also removes its contributions and payment history — this cannot be undone."
          className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
        >
          Delete loan
        </ConfirmDeleteButton>
      </div>
    </div>
  );
}
