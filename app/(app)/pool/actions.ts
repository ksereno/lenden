"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addDeposit(formData: FormData) {
  const amount = Number(formData.get("amount") ?? 0);
  const date = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (amount <= 0 || !date) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("pool_deposits").insert({ friend_id: user.id, amount, date, note, created_by: user.id });
  revalidatePath("/pool");
  revalidatePath("/");
}
