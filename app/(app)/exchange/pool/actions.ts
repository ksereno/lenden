"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BalanceType, ExchangeDepositSource } from "@/lib/types";

export async function addCapitalDeposit(formData: FormData) {
  const friend_id = String(formData.get("friend_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const balance_type = String(formData.get("balance_type") ?? "") as BalanceType;
  const source = String(formData.get("source") ?? "") as ExchangeDepositSource;
  const date = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (
    !friend_id ||
    amount <= 0 ||
    !date ||
    (balance_type !== "physical" && balance_type !== "digital") ||
    (source !== "contribution" && source !== "other_income")
  ) {
    redirect(`/exchange/pool/add-funds?error=invalid&message=${encodeURIComponent("Pick a friend, a type, and enter a valid amount, balance type, and date.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("exchange_capital_deposits")
    .insert({ friend_id, balance_type, amount, source, date, note, created_by: user.id });

  if (error) {
    redirect(`/exchange/pool/add-funds?error=create-failed&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/exchange/pool");
  revalidatePath("/exchange");
  revalidatePath("/");
  redirect("/exchange/pool");
}
