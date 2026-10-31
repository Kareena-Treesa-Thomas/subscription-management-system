import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/rbac";

// PLACEHOLDER — Shivani replaces this page with the finance dashboard.
export default async function DashboardPage() {
  const user = await requireRole("ADMIN", "STAFF");
  const links = [
    { href: "/subscriptions", title: "Subscriptions", body: "Quotations, confirmations and renewals." },
    { href: "/invoices", title: "Invoices", body: "Confirm, send, print and track invoices." },
    { href: "/payments", title: "Payments", body: "Record payments against invoices." },
    { href: "/products", title: "Products & plans", body: "Catalog, variants, taxes and plans." },
  ];
  return (
    <>
      <PageHeader title={`Good to see you, ${user.name?.split(" ")[0]}`} subtitle="The finance dashboard will appear here once it’s merged. Jump into any area below." />
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="group">
            <Card className="flex items-center justify-between p-5 transition-colors group-hover:border-brand-300">
              <div>
                <p className="font-semibold">{l.title}</p>
                <p className="mt-0.5 text-sm text-ink-soft">{l.body}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-mute transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
