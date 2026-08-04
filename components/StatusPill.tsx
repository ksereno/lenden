import type { LoanStatus } from "@/lib/types";

const styles: Record<LoanStatus, string> = {
  open: "bg-accent/15 text-accent",
  repaid: "bg-green-500/15 text-green-400",
  defaulted: "bg-red-500/15 text-red-400",
};

export function StatusPill({ status }: { status: LoanStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}
