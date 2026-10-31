import { Badge, Card, EmptyState, PageHeader, statusTone } from "@/components/ui";
import { SubscriptionActions } from "@/components/subscription-actions";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { fmtDate, money, periodLabel } from "@/lib/utils";

export const metadata = { title: "My subscriptions — Brightloop" };
export const dynamic = "force-dynamic";

export default async function PortalHome() {
  const user = await requireRole("CUSTOMER");

  // Always scoped to the signed-in customer — never trust an id from the URL.
  const [subs, outstanding] = await Promise.all([
    prisma.subscription.findMany({ where: { customerId: user.id }, include: { plan: true }, orderBy: { createdAt: "desc" } }),
    prisma.invoice.aggregate({ where: { customerId: user.id, status: "CONFIRMED" }, _sum: { total: true }, _count: true }),
  ]);

  const active = subs.filter((s) => s.status === "ACTIVE").length;
  const owed = Number(outstanding._sum.total ?? 0);

  return (
    <>
      <PageHeader title={`Hello, ${user.name?.split(" ")[0]}`} subtitle="Your plans, renewals and what’s due — all in one place." />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active subscriptions", value: String(active) },
          { label: "Unpaid invoices", value: String(outstanding._count) },
          { label: "Amount due", value: money(owed) },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-ink-soft">{s.label}</p>
            <p className="mt-1 font-display text-3xl font-bold tracking-tight">{s.value}</p>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 font-semibold">Subscriptions</h2>
      {subs.length === 0 ? (
        <EmptyState title="No subscriptions yet" body="When your Brightloop team sets up a plan for you, it will show up here." />
      ) : (
        <div className="space-y-4">
          {subs.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-ink-mute">{s.number}</p>
                  <h3 className="mt-0.5 font-semibold">{s.plan.name}</h3>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {money(Number(s.plan.price))} per {periodLabel(s.plan.billingPeriod)} × {s.quantity} {s.quantity === 1 ? "seat" : "seats"}
                  </p>
                </div>
                <Badge tone={statusTone[s.status]}>{s.status.charAt(0) + s.status.slice(1).toLowerCase()}</Badge>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div><dt className="text-ink-mute">Started</dt><dd className="font-medium">{fmtDate(s.startDate)}</dd></div>
                <div><dt className="text-ink-mute">Expires</dt><dd className="font-medium">{fmtDate(s.expiryDate)}</dd></div>
                <div><dt className="text-ink-mute">Payment terms</dt><dd className="font-medium">{s.paymentTerms}</dd></div>
                <div><dt className="text-ink-mute">Recurring total</dt><dd className="font-medium">{money(Number(s.plan.price) * s.quantity)}</dd></div>
              </dl>
              <div className="mt-4 border-t border-line pt-4">
                <SubscriptionActions id={s.id} status={s.status} pausable={s.plan.pausable} closable={s.plan.closable} renewable={s.plan.renewable} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
