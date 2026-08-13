"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BalanceType, PoolTransferDirection } from "@/lib/types";

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
