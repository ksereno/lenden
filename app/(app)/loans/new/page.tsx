import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/currentProfile";

export default async function NewLoanChoicePage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "owner" && profile?.role !== "contributor") redirect("/");

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">New loan</h1>
        <p className="mt-1 text-sm text-muted">How is this loan being funded?</p>
      </div>

      <div className="flex flex-col gap-4">
        <Link
          href="/loans/new/individual"
          className="rounded-lg border border-border bg-surface p-5 hover:border-accent"
        >
          <div className="font-medium text-foreground">Funded by Specific Friends</div>
          <p className="mt-1 text-sm text-muted">
            They contribute directly and earn all the interest.
          </p>
        </Link>

        <Link
          href="/loans/new/pool"
          className="rounded-lg border border-border bg-surface p-5 hover:border-accent"
        >
          <div className="font-medium text-foreground">Funded from the Shared Pool</div>
          <p className="mt-1 text-sm text-muted">
            Drawn from the group&apos;s pool — interest splits equally among everyone.
          </p>
        </Link>
      </div>
    </div>
  );
}
