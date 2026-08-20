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
import type { BalanceType, Payment, PoolTransferDirection } from "@/lib/types";

export async function addCapitalDeposit(formData: FormData) {
  const friend_id = String(formData.get("friend_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const balance_type = String(formData.get("balance_type") ?? "") as BalanceType;
  const date = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!friend_id || amount <= 0 || !date || (balance_type !== "physical" && balance_type !== "digital")) {
    redirect(`/exchange/pool/add-funds?error=invalid&message=${encodeURIComponent("Pick a friend and enter a valid amount, balance type, and date.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("exchange_capital_deposits")
    .insert({ friend_id, balance_type, amount, date, note, created_by: user.id });

  if (error) {
    redirect(`/exchange/pool/add-funds?error=create-failed&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/exchange/pool");
  revalidatePath("/exchange");
  revalidatePath("/");
  redirect("/exchange/pool");
}

export async function createTransfer(formData: FormData) {
  const amount = Number(formData.get("amount") ?? 0);
  const direction = String(formData.get("direction") ?? "") as PoolTransferDirection;
  const date = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  const validDirections: PoolTransferDirection[] = [
    "lending_to_exchange_physical",
    "lending_to_exchange_digital",
    "exchange_physical_to_lending",
    "exchange_digital_to_lending",
  ];

  if (amount <= 0 || !date || !validDirections.includes(direction)) {
    redirect(`/exchange/pool?error=transfer-invalid&message=${encodeURIComponent("Enter a valid amount, direction, and date.")}`);
  }

  if (direction === "lending_to_exchange_physical" || direction === "lending_to_exchange_digital") {
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
      redirect(`/exchange/pool?error=transfer-insufficient&message=${encodeURIComponent(`Lenden's pool only has ${available.toFixed(2)} available — that transfer would overdraw it.`)}`);
    }
  } else {
    const [transactions, capitalDeposits, transfers] = await Promise.all([
      getExchangeTransactions(),
      getExchangeCapitalDeposits(),
      getPoolTransfers(),
    ]);
    const { physicalBalance, digitalBalance } = exchangePoolBalance(transactions, capitalDeposits, transfers);
    const available = direction === "exchange_physical_to_lending" ? physicalBalance : digitalBalance;
    if (amount > available) {
      redirect(`/exchange/pool?error=transfer-insufficient&message=${encodeURIComponent(`LendenX only has ${available.toFixed(2)} available in that balance — that transfer would overdraw it.`)}`);
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
    redirect(`/exchange/pool?error=transfer-failed&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/exchange/pool");
  revalidatePath("/exchange");
  revalidatePath("/lenden/pool");
  revalidatePath("/lenden");
  revalidatePath("/");
  redirect("/exchange/pool");
}
