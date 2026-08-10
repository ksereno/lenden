"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLoans, getAllPayments, getPoolDeposits } from "@/lib/queries";
import { poolSummary } from "@/lib/loanMath";
import type { Payment } from "@/lib/types";

export async function createPoolLoan(formData: FormData) {
  const borrower_id = String(formData.get("borrower_id") ?? "");
  const principal = Number(formData.get("principal") ?? 0);
  const interest_rate_percent = Number(formData.get("interest_rate_percent") ?? 0);
  const date_issued = String(formData.get("date_issued") ?? "");
  const due_date = String(formData.get("due_date") ?? "").trim() || null;
  const term_description = String(formData.get("term_description") ?? "").trim();

  if (!borrower_id || !date_issued || principal <= 0) return;

  const [loans, allPayments, deposits] = await Promise.all([
    getLoans(),
    getAllPayments(),
    getPoolDeposits(),
  ]);
  const paymentsByLoan = new Map<string, Payment[]>();
  for (const p of allPayments) {
    const list = paymentsByLoan.get(p.loan_id) ?? [];
    list.push(p);
    paymentsByLoan.set(p.loan_id, list);
  }
  const { available } = poolSummary(loans, paymentsByLoan, deposits);

  if (principal > available) {
    redirect(`/loans/new/pool?error=insufficient&needed=${principal}&available=${available}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: loan, error } = await supabase
    .from("loans")
    .insert({
      borrower_id,
      principal,
      interest_rate_percent,
      interest_type: "flat",
      date_issued,
      due_date,
      term_description,
      status: "open",
      funding_source: "pool",
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !loan) {
    redirect(`/loans/new/pool?error=create-failed&message=${encodeURIComponent(error?.message ?? "unknown error")}`);
  }

  redirect(`/loans/${loan.id}`);
}
