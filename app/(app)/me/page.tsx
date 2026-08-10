import Link from "next/link";
import { redirect } from "next/navigation";
import { getLoans, getBorrowers, getAllContributions, getAllPayments, getCoreFriends } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { loanTotals, friendShares } from "@/lib/loanMath";
import { formatMoney, formatPercent } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { StatusPill } from "@/components/StatusPill";

export default async function MePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [loans, borrowers, allContributions, allPayments, coreFriends] = await Promise.all([
    getLoans(),
    getBorrowers(),
    getAllContributions(),
    getAllPayments(),
    getCoreFriends(),
  ]);

  const borrowerById = new Map(borrowers.map((b) => [b.id, b]));

  const rows = loans
    .map((loan) => {
      const contributions = allContributions.filter((c) => c.loan_id === loan.id);
      const payments = allPayments.filter((p) => p.loan_id === loan.id);
      const mine = friendShares(loan, contributions, payments, coreFriends).find(
        (s) => s.friendId === profile.id,
      );
      if (!mine) return null;
      return { loan, borrower: borrowerById.get(loan.borrower_id), share: mine, totals: loanTotals(loan, payments) };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const activeRows = rows.filter((r) => r.loan.status !== "cancelled");
  const totalContributed = activeRows.reduce((sum, r) => sum + r.share.contribution, 0);
  const totalInterestEarned = activeRows.reduce((sum, r) => sum + r.share.interestEarned, 0);
  const totalOutstanding = activeRows.reduce((sum, r) => sum + Math.max(r.share.outstanding, 0), 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{profile.full_name || profile.email}</h1>
        <p className="mt-1 text-sm text-muted">Your contributions across every loan.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total contributed" value={formatMoney(totalContributed)} />
        <StatCard label="Interest earned" value={formatMoney(totalInterestEarned)} />
        <StatCard label="Outstanding to you" value={formatMoney(totalOutstanding)} />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">No loans to show yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Borrower</th>
                <th className="px-4 py-2 font-medium">Funding</th>
                <th className="px-4 py-2 font-medium">Your contribution</th>
                <th className="px-4 py-2 font-medium">Your share</th>
                <th className="px-4 py-2 font-medium">Interest earned</th>
                <th className="px-4 py-2 font-medium">Outstanding</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ loan, borrower, share }) => (
                <tr key={loan.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    <Link href={`/loans/${loan.id}`} className="text-foreground hover:text-accent">
                      {borrower?.name ?? "Unknown"}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {loan.funding_source === "pool" ? "Pool" : "Individual"}
                  </td>
                  <td className="px-4 py-2 text-foreground">{formatMoney(share.contribution)}</td>
                  <td className="px-4 py-2 text-muted">{formatPercent(share.sharePercent)}</td>
                  <td className="px-4 py-2 text-foreground">{formatMoney(share.interestEarned)}</td>
                  <td className="px-4 py-2 text-foreground">{formatMoney(share.outstanding)}</td>
                  <td className="px-4 py-2"><StatusPill status={loan.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
