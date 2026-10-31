"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDate } from "@/lib/format";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/invoices", label: "Invoices" },
  { href: "/payments", label: "Payments" },
];

export function Sidebar({ today, simulated }: { today: string; simulated: boolean }) {
  const pathname = usePathname();
  return (
    <aside className="bg-ink text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col">
      <div className="flex items-center justify-between px-5 py-4 lg:block lg:py-6">
        <div>
          <p className="text-lg font-semibold tracking-tight">Brightloop</p>
          <p className="text-sm text-white/60">Finance</p>
        </div>
        <p className="text-xs text-white/60 lg:hidden">
          {formatDate(today)}
          {simulated ? " (simulated)" : ""}
        </p>
      </div>
      <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:pb-0">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden px-5 py-5 text-xs text-white/60 lg:block">
        <p>App date</p>
        <p className="mt-0.5 text-sm font-medium text-white">{formatDate(today)}</p>
        {simulated && <p className="mt-1 text-[#F2B84B]">Simulated for the demo</p>}
      </div>
    </aside>
  );
}
