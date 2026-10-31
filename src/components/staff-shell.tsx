"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BadgePercent, CreditCard, FileText, LayoutDashboard, Menu, Package, Repeat, UserPlus, X } from "lucide-react";
import { Logo } from "@/components/ui";
import { cn } from "@/lib/utils";

// Route names agreed with the team. Pages owned by teammates appear once they're merged.
const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "STAFF"] },
  { label: "Subscriptions", href: "/subscriptions", icon: Repeat, roles: ["ADMIN", "STAFF"] },
  { label: "Invoices", href: "/invoices", icon: FileText, roles: ["ADMIN", "STAFF"] },
  { label: "Payments", href: "/payments", icon: CreditCard, roles: ["ADMIN", "STAFF"] },
  { label: "Products & plans", href: "/products", icon: Package, roles: ["ADMIN", "STAFF"] },
  { label: "Discounts", href: "/discounts", icon: BadgePercent, roles: ["ADMIN"] },
  { label: "Staff", href: "/staff", icon: UserPlus, roles: ["ADMIN"] },
];

export function StaffShell({ role, topRight, children }: { role: string; topRight: React.ReactNode; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => n.roles.includes(role));

  const links = (
    <nav aria-label="Main" className="mt-6 space-y-1">
      {items.map(({ label, href, icon: Icon }) => {
        const active = path === href || path.startsWith(href + "/");
        return (
          <Link
            key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-white/12 text-white" : "text-brand-100/80 hover:bg-white/8 hover:text-white"
            )}
          >
            <Icon className={cn("h-[18px] w-[18px]", active && "text-saffron-500")} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col bg-brand-900 px-4 py-6 lg:flex">
        <Logo light className="px-2" />
        {links}
        <p className="mt-auto px-3 text-xs text-brand-200/60">Brightloop Software<br />Billing console</p>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-brand-900 px-4 py-6">
            <div className="flex items-center justify-between px-2">
              <Logo light />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-white"><X className="h-5 w-5" /></button>
            </div>
            {links}
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur sm:px-8">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-slate-100 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden"><Logo /></div>
          <div className="ml-auto">{topRight}</div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
