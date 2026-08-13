import type { ExchangeTransactionStatus } from "@/lib/types";

const styles: Record<ExchangeTransactionStatus, string> = {
  completed: "bg-green-500/15 text-green-400",
  cancelled: "bg-muted/15 text-muted",
};

export function ExchangeStatusPill({ status }: { status: ExchangeTransactionStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}
