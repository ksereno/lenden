"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LoanStatus } from "@/lib/types";

export async function addPayment(loanId: string, formData: FormData) {
  const amount = Number(formData.get("amount") ?? 0);
  const date_received = String(formData.get("date_received") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (amount <= 0 || !date_received) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("payments").insert({ loan_id: loanId, amount, date_received, note, created_by: user.id });
  revalidatePath(`/loans/${loanId}`);
  revalidatePath("/");
  revalidatePath("/reports");
  revalidatePath("/me");
}

export async function setLoanStatus(loanId: string, status: LoanStatus) {
  const supabase = await createClient();
  await supabase.from("loans").update({ status }).eq("id", loanId);
  revalidatePath(`/loans/${loanId}`);
  revalidatePath("/");
}
