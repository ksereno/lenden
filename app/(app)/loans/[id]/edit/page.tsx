import { notFound, redirect } from "next/navigation";
import { getLoan, getBorrower } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { updateLoan } from "../actions";

export default async function EditLoanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = await getCurrentProfile();
  if (profile?.role !== "owner") redirect(`/loans/${id}`);

  const loan = await getLoan(id);
  if (!loan) notFound();

  const borrower = await getBorrower(loan.borrower_id);

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
          </select>
        </label>

        <button
          type="submit"
          className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
