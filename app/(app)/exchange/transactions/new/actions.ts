"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getExchangeTransactions, getExchangeCapitalDeposits, getPoolTransfers, getCoreFriends } from "@/lib/queries";
import { computeTieredFee, exchangePoolBalance } from "@/lib/exchangeMath";
import type { ExchangeTransactionType, FundingSource } from "@/lib/types";

export async function createExchangeTransaction(
  type: ExchangeTransactionType,
  fundingSource: FundingSource,
  formData: FormData,
) {
  const basePath = `/exchange/transactions/new/${type === "cash_in" ? "cash-in" : "cash-out"}/${fundingSource}`;

  const amount = Number(formData.get("amount") ?? 0);
  const manualFee = Number(formData.get("manual_fee") ?? 0);
  const counterparty_name = String(formData.get("counterparty_name") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (amount <= 0 || !date) {
    redirect(`${basePath}?error=invalid&message=${encodeURIComponent("Enter a valid amount and date.")}`);
  }

  const fee_is_manual = manualFee > 0;
  const fee = fee_is_manual ? manualFee : computeTieredFee(amount);

  if (fundingSource === "pool") {
    const [transactions, capitalDeposits, transfers] = await Promise.all([
      getExchangeTransactions(),
      getExchangeCapitalDeposits(),
      getPoolTransfers(),
    ]);
    const { physicalBalance, digitalBalance } = exchangePoolBalance(transactions, capitalDeposits, transfers);
    const available = type === "cash_in" ? digitalBalance : physicalBalance;

    if (amount > available) {
      redirect(`${basePath}?error=insufficient&needed=${amount}&available=${available}`);
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: tx, error } = await supabase
    .from("exchange_transactions")
    .insert({
      type,
      funding_source: fundingSource,
      amount,
      fee,
      fee_is_manual,
      counterparty_name,
      date,
      note,
      status: "completed",
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !tx) {
    redirect(`${basePath}?error=create-failed&message=${encodeURIComponent(error?.message ?? "unknown error")}`);
  }

  if (fundingSource === "individual") {
    const coreFriends = await getCoreFriends();
    const shares = coreFriends
      .filter((f) => {
        const raw = formData.get(`profit_share_${f.id}`);
        return raw !== null && String(raw).trim() !== "";
      })
      .map((f) => ({
        transaction_id: tx.id,
        friend_id: f.id,
        profit_share: Number(formData.get(`profit_share_${f.id}`) ?? 0),
      }));

    if (shares.length > 0) {
      await supabase.from("exchange_transaction_shares").insert(shares);
    }
  }

  redirect(`/exchange/transactions/${tx.id}`);
}
