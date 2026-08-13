import Link from "next/link";
import {
  getLoans,
  getAllContributions,
  getAllPayments,
  getCoreFriends,
  getExchangeTransactions,
  getAllExchangeTransactionShares,
} from "@/lib/queries";
import { friendShares, adminFee } from "@/lib/loanMath";
import { exchangeFriendShares, exchangeFee, titaAFee, TITA_A_LABEL } from "@/lib/exchangeMath";
import { formatMoney } from "@/lib/format";
import { FriendBadge } from "@/components/FriendBadge";
import { StatCard } from "@/components/StatCard";
import type { LoanContribution, Payment, ExchangeTransactionShare } from "@/lib/types";

export default async function CombinedReportsPage() {
  const [loans, allContributions, allPayments, coreFriends, transactions, allShares] = await Promise.all([
    getLoans(),
    getAllContributions(),
    getAllPayments(),
    getCoreFriends(),
    getExchangeTransactions(),
    getAllExchangeTransactionShares(),
  ]);

  const contributionsByLoan = new Map<string, LoanContribution[]>();
  for (const c of allContributions) {
    const list = contributionsByLoan.get(c.loan_id) ?? [];
    list.push(c);
    contributionsByLoan.set(c.loan_id, list);
  }
  const paymentsByLoan = new Map<string, Payment[]>();
  for (const p of allPayments) {
    const list = paymentsByLoan.get(p.loan_id) ?? [];
    list.push(p);
    paymentsByLoan.set(p.loan_id, list);
  }
  const sharesByTx = new Map<string, ExchangeTransactionShare[]>();
  for (const s of allShares) {
    const list = sharesByTx.get(s.transaction_id) ?? [];
    list.push(s);
    sharesByTx.set(s.transaction_id, list);
  }

  const byFriend = new Map(
    coreFriends.map((f) => [f.id, { profile: f, lendingEarnings: 0, exchangeEarnings: 0 }]),
  );

  let totalAdminFee = 0;
  for (const loan of loans) {
    if (loan.status === "cancelled") continue;
    const shares = friendShares(loan, contributionsByLoan.get(loan.id) ?? [], paymentsByLoan.get(loan.id) ?? [], coreFriends);
    for (const s of shares) {
      const agg = byFriend.get(s.friendId);
      if (agg) agg.lendingEarnings += s.interestEarned;
    }
    totalAdminFee += adminFee(loan);
  }

  let totalKatchFee = 0;
  let totalTitaAFee = 0;
  for (const tx of transactions) {
    if (tx.status === "cancelled") continue;
    const shares = exchangeFriendShares(tx, sharesByTx.get(tx.id) ?? [], coreFriends);
    for (const s of shares) {
      const agg = byFriend.get(s.friendId);
      if (agg) agg.exchangeEarnings += s.profitShare;
    }
    totalKatchFee += exchangeFee(tx);
    totalTitaAFee += titaAFee(tx);
  }

  const rows = [...byFriend.values()].map((r) => {
    const isAdminFeeRecipient = r.profile.receives_admin_fee;
    const isExchangeFeeRecipient = r.profile.receives_exchange_fee;
    const lending = r.lendingEarnings + (isAdminFeeRecipient ? totalAdminFee : 0);
    const exchange = r.exchangeEarnings + (isExchangeFeeRecipient ? totalKatchFee : 0);
    return { ...r, lending, exchange, combined: lending + exchange };
  });

  const totalCombined = rows.reduce((sum, r) => sum + r.combined, 0);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Combined Reports</h1>
        <p className="mt-1 text-sm text-muted">
          Lenden + LendenX earnings together. For full detail see{" "}
          <Link href="/lenden/reports" className="text-accent hover:opacity-80">Lenden Reports</Link>
          {" "}or{" "}
          <Link href="/exchange/reports" className="text-accent hover:opacity-80">LendenX Reports</Link>.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Combined earnings (all 5)" value={formatMoney(totalCombined)} />
        <StatCard label="Efren's admin fee total" value={formatMoney(totalAdminFee)} />
        <StatCard label={`Katch's exchange fee + ${TITA_A_LABEL}'s total`} value={formatMoney(totalKatchFee + totalTitaAFee)} />
      </div>

      <div>
        <h2 className="mb-4 text-sm font-medium text-muted">By friend</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Friend</th>
                <th className="px-4 py-2 font-medium">Lending earnings</th>
                <th className="px-4 py-2 font-medium">Exchange earnings</th>
                <th className="px-4 py-2 font-medium">Combined total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.profile.id} className="border-t border-border">
                  <td className="px-4 py-2"><FriendBadge profile={row.profile} /></td>
                  <td className="px-4 py-2 text-foreground">{formatMoney(row.lending)}</td>
                  <td className="px-4 py-2 text-foreground">{formatMoney(row.exchange)}</td>
                  <td className="px-4 py-2 font-medium text-foreground">{formatMoney(row.combined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          Efren&apos;s row includes his admin fee; Katch&apos;s row includes her exchange fee. {TITA_A_LABEL} is
          external to the group and not shown here — see LendenX Reports for her total.
        </p>
      </div>
    </div>
  );
}
