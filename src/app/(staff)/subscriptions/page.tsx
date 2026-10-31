import { Badge, Card, EmptyState, PageHeader, statusTone } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { fmtDate, money } from "@/lib/utils";

export const metadata = { title: "Subscriptions — Brightloop" };
export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  await requireRole("ADMIN", "STAFF");
  const subscriptions = await prisma.subscription.findMany({
    include: { customer: { select: { name: true, email: true } }, plan: true, lines: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeader title="Subscriptions" subtitle="Review customer plans, recurring totals and current status." />
      {subscriptions.length === 0 ? (
        <EmptyState title="No subscriptions yet" body="Customer subscriptions will appear here when they are created." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line bg-paper text-xs text-ink-soft">
                <tr>
                  {["Subscription", "Customer", "Plan", "Started", "Recurring total", "Status"].map((heading) => (
                    <th key={heading} className="px-5 py-3 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {subscriptions.map((subscription) => {
                  const status = subscription.paused ? "PAUSED" : subscription.status;
                  const total = subscription.lines.reduce((sum, line) => sum + Number(line.amount), 0);
                  return (
                    <tr key={subscription.id}>
                      <td className="px-5 py-3 font-medium">{subscription.number}</td>
                      <td className="px-5 py-3">
                        <div className="font-medium">{subscription.customer.name}</div>
                        <div className="text-xs text-ink-soft">{subscription.customer.email}</div>
                      </td>
                      <td className="px-5 py-3">{subscription.plan.name}</td>
                      <td className="px-5 py-3 text-ink-soft">{fmtDate(subscription.startDate)}</td>
                      <td className="px-5 py-3 font-medium tabular-nums">{money(total)}</td>
                      <td className="px-5 py-3"><Badge tone={statusTone[status]}>{status}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {subscriptions.length === 100 && (
            <p className="border-t border-line px-5 py-3 text-xs text-ink-soft">Showing the 100 most recent subscriptions.</p>
          )}
        </Card>
      )}
    </>
  );
}
