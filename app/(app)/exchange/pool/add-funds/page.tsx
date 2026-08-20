import Link from "next/link";
import { redirect } from "next/navigation";
import { getCoreFriends } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { addCapitalDeposit } from "../actions";

export default async function AddFundsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "owner" && profile?.role !== "contributor") redirect("/exchange");

  const { error, message } = await searchParams;
  const coreFriends = await getCoreFriends();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <div>
        <Link href="/exchange/pool" className="mb-2 inline-block text-xs text-muted hover:text-foreground">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Add funds</h1>
        <p className="mt-1 text-sm text-muted">Add money to the LendenX pool — either a friend&apos;s capital, or other earned income.</p>
        <p className="mt-3 text-sm font-medium" style={{ color: "#6B2737" }}>
          A friend contribution adds no profit and no admin fee. Other income (like mobile load top-up margins)
          counts toward Profit, same as a transaction fee — pick carefully below.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {message || "Something went wrong."}
        </p>
      )}

      <form action={addCapitalDeposit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">What is this?</span>
          <select
            name="source"
            required
            defaultValue="contribution"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
          >
            <option value="contribution">Friend contribution (capital — no profit, no admin fee)</option>
            <option value="other_income">Other income (e.g. mobile load — counts as profit)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Friend</span>
          <select
            name="friend_id"
            required
            defaultValue={profile?.id}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
          >
            {coreFriends.map((f) => (
              <option key={f.id} value={f.id}>
                {f.full_name || f.email}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Balance</span>
          <select
            name="balance_type"
            required
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none"
          >
            <option value="physical">Physical</option>
            <option value="digital">Digital</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Amount</span>
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
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

        <button
          type="submit"
          className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Add funds
        </button>
      </form>
    </div>
  );
}
