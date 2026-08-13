"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ExchangeTransactionStatus } from "@/lib/types";

export async function setTransactionStatus(transactionId: string, status: ExchangeTransactionStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("exchange_transactions").update({ status }).eq("id", transactionId);
  if (error) {
    redirect(`/exchange/transactions/${transactionId}?error=update-failed&message=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/exchange/transactions/${transactionId}`);
  revalidatePath("/exchange");
  revalidatePath("/exchange/transactions");
  revalidatePath("/exchange/reports");
  revalidatePath("/reports");
}

export async function updateTransaction(transactionId: string, formData: FormData) {
  const counterparty_name = String(formData.get("counterparty_name") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const status = String(formData.get("status") ?? "completed") as ExchangeTransactionStatus;
  if (!date) {
    redirect(`/exchange/transactions/${transactionId}/edit?error=invalid&message=${encodeURIComponent("Date is required.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("exchange_transactions")
    .update({ counterparty_name, date, note, status })
    .eq("id", transactionId);

  if (error) {
    redirect(`/exchange/transactions/${transactionId}/edit?error=update-failed&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/exchange/transactions/${transactionId}`);
  revalidatePath("/exchange");
  revalidatePath("/exchange/transactions");
  revalidatePath("/exchange/reports");
  revalidatePath("/reports");
  redirect(`/exchange/transactions/${transactionId}`);
}

export async function deleteTransaction(transactionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("exchange_transactions").delete().eq("id", transactionId);
  if (error) {
    redirect(`/exchange/transactions/${transactionId}?error=delete-failed&message=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/exchange");
  revalidatePath("/exchange/transactions");
  revalidatePath("/exchange/reports");
  revalidatePath("/reports");
  redirect("/exchange/transactions");
}
