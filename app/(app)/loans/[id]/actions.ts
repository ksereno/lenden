"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function updateLoan(loanId: string, formData: FormData) {
  const interest_rate_percent = Number(formData.get("interest_rate_percent") ?? 0);
  const date_issued = String(formData.get("date_issued") ?? "");
  const due_date = String(formData.get("due_date") ?? "").trim() || null;
  const term_description = String(formData.get("term_description") ?? "").trim();
  const status = String(formData.get("status") ?? "open") as LoanStatus;
  if (!date_issued) return;

  const supabase = await createClient();
  await supabase
    .from("loans")
    .update({ interest_rate_percent, date_issued, due_date, term_description, status })
    .eq("id", loanId);

  revalidatePath(`/loans/${loanId}`);
  revalidatePath("/");
  revalidatePath("/loans");
  revalidatePath("/reports");
  redirect(`/loans/${loanId}`);
}

export async function deleteLoan(loanId: string) {
  const supabase = await createClient();
  await supabase.from("loans").delete().eq("id", loanId);
  revalidatePath("/");
  revalidatePath("/loans");
  revalidatePath("/reports");
  revalidatePath("/me");
  redirect("/loans");
}
