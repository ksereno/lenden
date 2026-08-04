"use server";

import { revalidatePath } from "next/cache";
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
