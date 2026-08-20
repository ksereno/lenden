"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getLoans,
  getAllPayments,
  getPoolDeposits,
  getPoolTransfers,
  getExchangeTransactions,
  getExchangeCapitalDeposits,
} from "@/lib/queries";
import { poolSummary } from "@/lib/loanMath";
import { exchangePoolBalance } from "@/lib/exchangeMath";
import type { Payment, PoolTransferDirection } from "@/lib/types";

export async function createTransfer(formData: FormData) {
  const amount = Number(formData.get("amount") ?? 0);
  const direction = String(formData.get("direction") ?? "") as PoolTransferDirection;
  const date = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  const validDirections: PoolTransferDirection[] = ["lending_to_exchange", "exchange_to_lending"];

  if (amount <= 0 || !date || !validDirections.includes(direction)) {
    redirect(`/transfer?error=transfer-invalid&message=${encodeURIComponent("Enter a valid amount, direction, and date.")}`);
  }

  if (direction === "lending_to_exchange") {
    const [loans, allPayments, deposits, transfers] = await Promise.all([
      getLoans(),
      getAllPayments(),
      getPoolDeposits(),
      getPoolTransfers(),
    ]);
    const paymentsByLoan = new Map<string, Payment[]>();
    for (const p of allPayments) {
      const list = paymentsByLoan.get(p.loan_id) ?? [];
      list.push(p);
      paymentsByLoan.set(p.loan_id, list);
    }
    const { available } = poolSummary(loans, paymentsByLoan, deposits, transfers);
    if (amount > available) {
      redirect(`/transfer?error=transfer-insufficient&message=${encodeURIComponent(`Lenden's pool only has ${available.toFixed(2)} available — that transfer would overdraw it.`)}`);
    }
  } else {
    const [transactions, capitalDeposits, transfers] = await Promise.all([
      getExchangeTransactions(),
      getExchangeCapitalDeposits(),
      getPoolTransfers(),
    ]);
    // Funds available for a transfer out of Lenden X come from its Total
    // Pool as a whole, not a physical/digital split -- that distinction
    // doesn't apply to a capital transfer.
    const { totalAvailable } = exchangePoolBalance(transactions, capitalDeposits, transfers);
    if (amount > totalAvailable) {
      redirect(`/transfer?error=transfer-insufficient&message=${encodeURIComponent(`Lenden X's total pool only has ${totalAvailable.toFixed(2)} available — that transfer would overdraw it.`)}`);
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("pool_transfers")
    .insert({ direction, amount, date, note, created_by: user.id });

  if (error) {
    redirect(`/transfer?error=transfer-failed&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/transfer");
  revalidatePath("/exchange/pool");
  revalidatePath("/exchange");
  revalidatePath("/lenden/pool");
  revalidatePath("/lenden");
  revalidatePath("/");
  redirect("/transfer");
}
