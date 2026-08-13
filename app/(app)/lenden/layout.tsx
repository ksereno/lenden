import Link from "next/link";
import { getCurrentProfile } from "@/lib/currentProfile";

export default async function LendenLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  const navLinks = [
    { href: "/lenden", label: "Dashboard" },
    { href: "/lenden/loans", label: "Loans" },
    { href: "/lenden/pool", label: "Pool" },
    { href: "/lenden/borrowers", label: "Borrowers" },
    { href: "/lenden/reports", label: "Reports" },
    { href: "/lenden/me", label: "Me" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <nav className="flex items-center gap-5 overflow-x-auto border-b border-border pb-3 text-sm whitespace-nowrap">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="text-muted hover:text-foreground">
            {link.label}
          </Link>
        ))}
        {(profile?.role === "owner" || profile?.role === "contributor") && (
          <Link href="/lenden/loans/new" className="text-accent hover:opacity-80">
            + New loan
          </Link>
        )}
        {(profile?.receives_admin_fee || profile?.role === "owner") && (
          <Link href="/lenden/commissions" className="text-muted hover:text-foreground">
            Commissions
          </Link>
        )}
      </nav>

      {children}
    </div>
  );
}
