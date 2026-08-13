import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/currentProfile";
import { signOut } from "@/app/actions";
import { RefreshButton } from "@/components/RefreshButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-foreground">
            <Image src="/icon.svg" alt="" width={24} height={24} className="rounded" />
            Lenden
          </Link>

          <div className="flex min-w-0 items-center gap-3 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: profile.highlight_color }}
              aria-hidden
            />
            <span className="truncate text-muted">{profile.full_name || profile.email}</span>
            <Link href="/" aria-label="Home" title="Back to Lenden / LendenX" className="shrink-0 text-muted hover:text-foreground">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 7.5 8 2l6 5.5V14a1 1 0 0 1-1 1h-3v-4.5H6V15H3a1 1 0 0 1-1-1V7.5Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link href="/reports" className="text-muted hover:text-foreground">
              Reports
            </Link>
            <RefreshButton />
            <form action={signOut} className="shrink-0">
              <button type="submit" className="text-accent hover:opacity-80">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
