import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/currentProfile";

export default async function NewTransactionChoicePage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "owner" && profile?.role !== "contributor") redirect("/exchange");

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">New transaction</h1>
        <p className="mt-1 text-sm text-muted">Is the customer cashing in or cashing out?</p>
      </div>

      <div className="flex flex-col gap-4">
        <Link
          href="/exchange/transactions/new/cash-in"
          className="rounded-lg border border-border bg-surface p-5 hover:border-accent"
        >
          <div className="font-medium text-foreground">Cash In</div>
          <p className="mt-1 text-sm text-muted">
            Customer hands over physical pesos; we send digital pesos to their wallet.
          </p>
        </Link>

        <Link
          href="/exchange/transactions/new/cash-out"
          className="rounded-lg border border-border bg-surface p-5 hover:border-accent"
        >
          <div className="font-medium text-foreground">Cash Out</div>
          <p className="mt-1 text-sm text-muted">
            Customer sends digital pesos; we hand over physical pesos.
          </p>
        </Link>
      </div>
    </div>
  );
}
