import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/currentProfile";
import { signOut } from "@/app/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/loans", label: "Loans" },
    { href: "/borrowers", label: "Borrowers" },
    { href: "/reports", label: "Reports" },
    { href: "/me", label: "Me" },
  ];

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
            <form action={signOut} className="shrink-0">
              <button type="submit" className="text-muted hover:text-foreground">
                Sign out
              </button>
            </form>
          </div>
        </div>

        <nav className="mx-auto flex max-w-5xl items-center gap-5 overflow-x-auto px-4 pb-3 text-sm whitespace-nowrap">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted hover:text-foreground">
              {link.label}
            </Link>
          ))}
          {profile.role === "owner" && (
            <Link href="/loans/new" className="text-accent hover:opacity-80">
              + New loan
            </Link>
          )}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
