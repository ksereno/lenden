import Link from "next/link";
import { getLoans, getBorrowers, getProfiles, getAllContributions, getAllPayments, getCoreFriends } from "@/lib/queries";
import { loanTotals, friendShares } from "@/lib/loanMath";
import { formatMoney } from "@/lib/format";
import { FriendBadge } from "@/components/FriendBadge";
import { StatusPill } from "@/components/StatusPill";
import { StatCard } from "@/components/StatCard";
import { ShareBars } from "@/components/ShareBars";

export default async function ReportsPage() {
  const [loans, borrowers, profiles, allContributions, allPayments, coreFriends] = await Promise.all([
    getLoans(),
    getBorrowers(),
    getProfiles(),
    getAllContributions(),
    getAllPayments(),
    getCoreFriends(),
  ]);

  const borrowerById = new Map(borrowers.map((b) => [b.id, b]));

  const byFriend = new Map(
    profiles.map((p) => [p.id, { profile: p, contributed: 0, interestEarned: 0, outstanding: 0 }]),
  );

  const loanRows = loans.map((loan) => {
    const contributions = allContributions.filter((c) => c.loan_id === loan.id);
    const payments = allPayments.filter((p) => p.loan_id === loan.id);
    const shares = friendShares(loan, contributions, payments, coreFriends);

    if (loan.status !== "cancelled") {
      for (const s of shares) {
        const agg = byFriend.get(s.friendId);
        if (!agg) continue;
        agg.contributed += s.contribution;
        agg.interestEarned += s.interestEarned;
        agg.outstanding += Math.max(s.outstanding, 0);
      }
    }

    return { loan, borrower: borrowerById.get(loan.borrower_id), totals: loanTotals(loan, payments) };
  });

  const friendRows = [...byFriend.values()];
  const totalLent = friendRows.reduce((sum, r) => sum + r.contributed, 0);
  const totalInterest = friendRows.reduce((sum, r) => sum + r.interestEarned, 0);
  const totalOutstanding = friendRows.reduce((sum, r) => sum + r.outstanding, 0);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted">Aggregate view across every friend and every loan.</p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Total of all of us</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total lent" value={formatMoney(totalLent)} />
          <StatCard label="Total interest earned" value={formatMoney(totalInterest)} />
          <StatCard label="Total outstanding" value={formatMoney(totalOutstanding)} />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-medium text-muted">By friend</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <ShareBars title="Lent" rows={friendRows.map((r) => ({ profile: r.profile, value: r.contributed }))} />
          <ShareBars
            title="Interest earned"
            rows={friendRows.map((r) => ({ profile: r.profile, value: r.interestEarned }))}
          />
          <ShareBars
            title="Awaiting payment"
            rows={friendRows.map((r) => ({ profile: r.profile, value: r.outstanding }))}
          />
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Friend</th>
                <th className="px-4 py-2 font-medium">Contributed</th>
                <th className="px-4 py-2 font-medium">Interest earned</th>
                <th className="px-4 py-2 font-medium">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {friendRows.map((row) => (
                <tr key={row.profile.id} className="border-t border-border">
                  <td className="px-4 py-2"><FriendBadge profile={row.profile} /></td>
                  <td className="px-4 py-2 text-foreground">{formatMoney(row.contributed)}</td>
                  <td className="px-4 py-2 text-foreground">{formatMoney(row.interestEarned)}</td>
                  <td className="px-4 py-2 text-foreground">{formatMoney(row.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">By loan</h2>
        {loanRows.length === 0 ? (
          <p className="text-sm text-muted">No loans yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Borrower</th>
                  <th className="px-4 py-2 font-medium">Principal</th>
                  <th className="px-4 py-2 font-medium">Interest</th>
                  <th className="px-4 py-2 font-medium">Repaid</th>
                  <th className="px-4 py-2 font-medium">Balance</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loanRows.map(({ loan, borrower, totals }) => (
                  <tr key={loan.id} className="border-t border-border">
                    <td className="px-4 py-2">
                      <Link href={`/loans/${loan.id}`} className="text-foreground hover:text-accent">
                        {borrower?.name ?? "Unknown"}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-foreground">{formatMoney(loan.principal)}</td>
                    <td className="px-4 py-2 text-foreground">{formatMoney(totals.totalInterest)}</td>
                    <td className="px-4 py-2 text-foreground">{formatMoney(totals.totalRepaid)}</td>
                    <td className="px-4 py-2 text-foreground">{formatMoney(totals.balance)}</td>
                    <td className="px-4 py-2"><StatusPill status={loan.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
