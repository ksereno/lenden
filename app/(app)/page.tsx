import Link from "next/link";
import { getLoans, getAllPayments, getExchangeTransactions, getExchangeCapitalDeposits, getPoolTransfers } from "@/lib/queries";
import { loanTotals } from "@/lib/loanMath";
import { exchangePoolBalance } from "@/lib/exchangeMath";
import { formatMoney } from "@/lib/format";
import type { Payment } from "@/lib/types";

export default async function HubPage() {
  const [loans, allPayments, transactions, capitalDeposits, transfers] = await Promise.all([
    getLoans(),
    getAllPayments(),
    getExchangeTransactions(),
    getExchangeCapitalDeposits(),
    getPoolTransfers(),
  ]);

  const paymentsByLoan = new Map<string, Payment[]>();
  for (const p of allPayments) {
    const list = paymentsByLoan.get(p.loan_id) ?? [];
    list.push(p);
    paymentsByLoan.set(p.loan_id, list);
  }

  const activeLoans = loans.filter((l) => l.status !== "cancelled");
  const openLoans = activeLoans.filter((l) => l.status === "open");
  const totalOutstanding = activeLoans.reduce((sum, l) => {
    const totals = loanTotals(l, paymentsByLoan.get(l.id) ?? []);
    return sum + Math.max(totals.balance, 0);
  }, 0);

  const { physicalBalance, digitalBalance } = exchangePoolBalance(transactions, capitalDeposits, transfers);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Lenden</h1>
        <p className="mt-1 text-sm text-muted">Two businesses, one group. Pick where you&apos;re headed.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/lenden"
          className="flex flex-col gap-4 rounded-lg border border-border bg-accent p-6 transition-opacity hover:opacity-90"
        >
          <div>
            <h2 className="text-lg font-semibold text-foreground">Lenden</h2>
            <p className="mt-1 text-sm text-foreground/70">Lending &amp; interest tracker.</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <div className="text-xs text-foreground/70">Outstanding</div>
              <div className="mt-0.5 font-medium text-foreground">{formatMoney(totalOutstanding)}</div>
            </div>
            <div>
              <div className="text-xs text-foreground/70">Open loans</div>
              <div className="mt-0.5 font-medium text-foreground">{openLoans.length}</div>
            </div>
          </div>
        </Link>

        <Link
          href="/exchange"
          className="exchange-theme flex flex-col gap-4 rounded-lg border border-border bg-accent p-6 transition-opacity hover:opacity-90"
        >
          <div>
            <h2 className="text-lg font-semibold text-foreground">LendenX</h2>
            <p className="mt-1 text-sm text-foreground/70">Cash in / cash out exchange.</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <div className="text-xs text-foreground/70">Physical</div>
              <div className="mt-0.5 font-medium text-foreground">{formatMoney(physicalBalance)}</div>
            </div>
            <div>
              <div className="text-xs text-foreground/70">Digital</div>
              <div className="mt-0.5 font-medium text-foreground">{formatMoney(digitalBalance)}</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
