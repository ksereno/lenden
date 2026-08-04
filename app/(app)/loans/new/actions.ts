"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfiles } from "@/lib/queries";

export async function createLoan(formData: FormData) {
  const borrower_id = String(formData.get("borrower_id") ?? "");
  const interest_rate_percent = Number(formData.get("interest_rate_percent") ?? 0);
  const date_issued = String(formData.get("date_issued") ?? "");
  const term_description = String(formData.get("term_description") ?? "").trim();

  if (!borrower_id || !date_issued) return;

  const profiles = await getProfiles();
  const contributions = profiles
    .map((p) => ({ friend_id: p.id, amount: Number(formData.get(`contribution_${p.id}`) ?? 0) }))
    .filter((c) => c.amount > 0);

  const principal = contributions.reduce((sum, c) => sum + c.amount, 0);
  if (principal <= 0) return;

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
      term_description,
      status: "open",
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !loan) return;

  await supabase
    .from("loan_contributions")
    .insert(contributions.map((c) => ({ loan_id: loan.id, friend_id: c.friend_id, amount: c.amount })));

  redirect(`/loans/${loan.id}`);
}
