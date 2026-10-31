"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "My subscriptions", href: "/portal" },
  { label: "My invoices", href: "/portal/invoices" },
];

export function CustomerNav({ right }: { right: React.ReactNode }) {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-8">
        <Link href="/portal"><Logo /></Link>
        <nav aria-label="Main" className="order-3 -mb-3 flex w-full gap-1 sm:order-none sm:mb-0 sm:w-auto">
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href} href={l.href} aria-current={active ? "page" : undefined}
                className={cn(
                  "border-b-2 px-3 py-2.5 text-sm font-medium transition-colors sm:border-b-0 sm:rounded-lg sm:py-2",
                  active ? "border-brand-500 text-brand-700 sm:bg-brand-50" : "border-transparent text-ink-soft hover:text-ink sm:hover:bg-slate-100"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto">{right}</div>
      </div>
    </header>
  );
}
