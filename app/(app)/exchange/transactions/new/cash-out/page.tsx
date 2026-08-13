import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/currentProfile";

export default async function CashOutFundingChoicePage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "owner" && profile?.role !== "contributor") redirect("/exchange");

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <div>
        <Link href="/exchange/transactions/new" className="mb-2 inline-block text-xs text-muted hover:text-foreground">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Cash Out</h1>
        <p className="mt-1 text-sm text-muted">How is this transaction funded?</p>
      </div>

      <div className="flex flex-col gap-4">
        <Link
          href="/exchange/transactions/new/cash-out/pool"
          className="rounded-lg border border-border bg-surface p-5 hover:border-accent"
        >
          <div className="font-medium text-foreground">From the Shared Pool</div>
          <p className="mt-1 text-sm text-muted">
            Drawn from LendenX&apos;s own balance — profit splits equally among everyone.
          </p>
        </Link>

        <Link
          href="/exchange/transactions/new/cash-out/individual"
          className="rounded-lg border border-border bg-surface p-5 hover:border-accent"
        >
          <div className="font-medium text-foreground">Specific Friends</div>
          <p className="mt-1 text-sm text-muted">
            Handled with a friend&apos;s own money — profit split is entered manually.
          </p>
        </Link>
      </div>
    </div>
  );
}
