"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addBorrower(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const contact_info = String(formData.get("contact_info") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("borrowers").insert({ name, contact_info, notes, created_by: user.id });
  revalidatePath("/borrowers");
}

export async function updateBorrower(borrowerId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const contact_info = String(formData.get("contact_info") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("borrowers").update({ name, contact_info, notes }).eq("id", borrowerId);
  revalidatePath("/borrowers");
  redirect("/borrowers");
}

export async function deleteBorrower(formData: FormData) {
  const borrowerId = String(formData.get("borrower_id") ?? "");
  if (!borrowerId) return;

  const supabase = await createClient();

  const { count } = await supabase
    .from("loans")
    .select("id", { count: "exact", head: true })
    .eq("borrower_id", borrowerId);

  if (count && count > 0) {
    redirect("/borrowers?error=has-loans");
  }

  await supabase.from("borrowers").delete().eq("id", borrowerId);
  revalidatePath("/borrowers");
  redirect("/borrowers?deleted=1");
}
