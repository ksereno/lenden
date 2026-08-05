import Link from "next/link";
import { redirect } from "next/navigation";
import { getBorrowers, getProfiles } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { FriendBadge } from "@/components/FriendBadge";
import { createLoan } from "./actions";

export default async function NewLoanPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "owner" && profile?.role !== "contributor") redirect("/");

  const [borrowers, profiles] = await Promise.all([getBorrowers(), getProfiles()]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">New loan</h1>
        <p className="mt-1 text-sm text-muted">
          Principal is the sum of what each friend contributes below.
        </p>
      </div>

      {borrowers.length === 0 ? (
        <p className="text-sm text-muted">
          No borrowers yet — <Link href="/borrowers" className="text-accent">add one first</Link>.
        </p>
      ) : (
        <form action={createLoan} className="flex flex-col gap-5">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Borrower</span>
            <select
              name="borrower_id"
              required
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            >
              {borrowers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Flat interest rate (%)</span>
            <input
              type="number"
              name="interest_rate_percent"
              step="0.01"
              min="0"
              required
              defaultValue={5}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Date issued</span>
            <input
              type="date"
              name="date_issued"
              required
              defaultValue={today}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Due date (optional)</span>
            <input
              type="date"
              name="due_date"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Term (optional)</span>
            <input
              type="text"
              name="term_description"
              placeholder="e.g. due in 3 months"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm text-muted">Contributions</legend>
            {profiles.map((p) => (
              <label key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <FriendBadge profile={p} />
                <input
                  type="number"
                  name={`contribution_${p.id}`}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-32 rounded-lg border border-border bg-surface px-3 py-1.5 text-right text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </label>
            ))}
          </fieldset>

          <button
            type="submit"
            className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            Create loan
          </button>
        </form>
      )}
    </div>
  );
}
