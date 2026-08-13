import { notFound, redirect } from "next/navigation";
import { getBorrower } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { updateBorrower } from "../../actions";

export default async function EditBorrowerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = await getCurrentProfile();
  if (profile?.role !== "owner") redirect("/lenden/borrowers");

  const borrower = await getBorrower(id);
  if (!borrower) notFound();

  return (
    <div className="flex max-w-md flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Edit borrower</h1>
      </div>

      <form action={updateBorrower.bind(null, borrower.id)} className="flex flex-col gap-3">
        <input
          name="name"
          required
          defaultValue={borrower.name}
          placeholder="Name"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <input
          name="contact_info"
          defaultValue={borrower.contact_info}
          placeholder="Contact info (phone, GCash number, etc.)"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <textarea
          name="notes"
          defaultValue={borrower.notes}
          placeholder="Notes"
          rows={2}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="self-start rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
