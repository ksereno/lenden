import Link from "next/link";
import { getCurrentProfile } from "@/lib/currentProfile";

export default async function ExchangeLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  const navLinks = [
    { href: "/exchange", label: "Dashboard" },
    { href: "/exchange/transactions", label: "Transactions" },
    { href: "/exchange/pool", label: "Pool" },
    { href: "/exchange/reports", label: "Reports" },
  ];

  return (
    <div className="exchange-theme flex flex-col gap-8">
      <nav className="flex items-center gap-5 overflow-x-auto border-b border-border pb-3 text-sm whitespace-nowrap">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="text-muted hover:text-foreground">
            {link.label}
          </Link>
        ))}
        {(profile?.role === "owner" || profile?.role === "contributor") && (
          <>
            <Link href="/exchange/transactions/new" className="text-accent hover:opacity-80">
              + New transaction
            </Link>
            <Link href="/exchange/pool/add-funds" className="text-accent hover:opacity-80">
              + Add funds
            </Link>
          </>
        )}
      </nav>

      {children}
    </div>
  );
}
