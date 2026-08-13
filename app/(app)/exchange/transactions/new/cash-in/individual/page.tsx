import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/currentProfile";
import { NewTransactionForm } from "../../NewTransactionForm";

export default async function CashInIndividualPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; needed?: string; available?: string; message?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "owner" && profile?.role !== "contributor") redirect("/exchange");

  return <NewTransactionForm type="cash_in" fundingSource="individual" searchParams={await searchParams} />;
}
