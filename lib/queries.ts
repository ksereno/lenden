import { createClient } from "@/lib/supabase/server";
import type { Borrower, Loan, LoanContribution, Payment, Profile } from "@/lib/types";

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("full_name");
  return data ?? [];
}

export async function getBorrowers(): Promise<Borrower[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("borrowers").select("*").order("name");
  return data ?? [];
}

export async function getBorrower(id: string): Promise<Borrower | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("borrowers").select("*").eq("id", id).single();
  return data;
}

export async function getLoans(): Promise<Loan[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("loans").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function getLoan(id: string): Promise<Loan | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("loans").select("*").eq("id", id).single();
  return data;
}

export async function getContributionsForLoan(loanId: string): Promise<LoanContribution[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("loan_contributions")
    .select("*")
    .eq("loan_id", loanId)
    .order("created_at");
  return data ?? [];
}

export async function getPaymentsForLoan(loanId: string): Promise<Payment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("loan_id", loanId)
    .order("date_received");
  return data ?? [];
}

export async function getAllContributions(): Promise<LoanContribution[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("loan_contributions").select("*");
  return data ?? [];
}

export async function getAllPayments(): Promise<Payment[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("payments").select("*");
  return data ?? [];
}
