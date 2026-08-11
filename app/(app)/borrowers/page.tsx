import Link from "next/link";
import { getBorrowers } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/currentProfile";
import { addBorrower, deleteBorrower } from "./actions";

export default async function BorrowersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string; message?: string }>;
}) {
  const [{ error, deleted, message }, borrowers, profile] = await Promise.all([
    searchParams,
    getBorrowers(),
    getCurrentProfile(),
  ]);
  const isOwner = profile?.role === "owner";
  const canAdd = isOwner || profile?.role === "contributor";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Borrowers</h1>
        <p className="mt-1 text-sm text-muted">The people loans are made to.</p>
      </div>

      {error === "has-loans" && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          Can&apos;t remove that borrower — they still have loans on record. Remove or reassign those first.
        </p>
      )}
      {deleted === "1" && (
        <p className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-muted">
          Borrower removed.
        </p>
      )}
      {error === "create-failed" && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          Couldn&apos;t add borrower: {message || "unknown error"}
        </p>
      )}

      {borrowers.length === 0 ? (
        <p className="text-sm text-muted">No borrowers yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Contact</th>
                <th className="px-4 py-2 font-medium">Notes</th>
                {isOwner && <th className="px-4 py-2 font-medium"></th>}
              </tr>
            </thead>
            <tbody>
              {borrowers.map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-4 py-2 text-foreground">{b.name}</td>
                  <td className="px-4 py-2 text-muted">{b.contact_info || "—"}</td>
                  <td className="px-4 py-2 text-muted">{b.notes || "—"}</td>
                  {isOwner && (
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <Link href={`/borrowers/${b.id}/edit`} className="text-muted hover:text-foreground">
                        Edit
                      </Link>
                      <form action={deleteBorrower} className="ml-3 inline">
                        <input type="hidden" name="borrower_id" value={b.id} />
                        <button type="submit" className="text-muted hover:text-red-400">
                          Remove
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canAdd && (
        <div className="max-w-md">
          <h2 className="mb-3 text-sm font-medium text-muted">Add a borrower</h2>
          <form action={addBorrower} className="flex flex-col gap-3">
            <input
              name="name"
              required
              placeholder="Name"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <input
              name="contact_info"
              placeholder="Contact info (phone, GCash number, etc.)"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <textarea
              name="notes"
              placeholder="Notes"
              rows={2}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              className="self-start rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
            >
              Add borrower
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
