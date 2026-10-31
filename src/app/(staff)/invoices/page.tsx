import { Badge, Card, EmptyState, PageHeader, statusTone } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { fmtDate, money } from "@/lib/utils";

export const metadata = { title: "Invoices — Brightloop" };
export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  await requireRole("ADMIN", "STAFF");
  const invoices = await prisma.invoice.findMany({
    include: { customer: { select: { name: true, email: true } }, subscription: { select: { number: true } } },
    orderBy: { issueDate: "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeader title="Invoices" subtitle="Review billed subscriptions, due dates and payment status." />
      {invoices.length === 0 ? (
        <EmptyState title="No invoices yet" body="Invoices will appear here after the billing process creates them." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line bg-paper text-xs text-ink-soft">
                <tr>
                  {["Invoice", "Customer", "Subscription", "Issued", "Due", "Total", "Status"].map((heading) => (
                    <th key={heading} className="px-5 py-3 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-5 py-3 font-medium">{invoice.number}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{invoice.customer.name}</div>
                      <div className="text-xs text-ink-soft">{invoice.customer.email}</div>
                    </td>
                    <td className="px-5 py-3">{invoice.subscription.number}</td>
                    <td className="px-5 py-3 text-ink-soft">{fmtDate(invoice.issueDate)}</td>
                    <td className="px-5 py-3 text-ink-soft">{fmtDate(invoice.dueDate)}</td>
                    <td className="px-5 py-3 font-medium tabular-nums">{money(Number(invoice.total))}</td>
                    <td className="px-5 py-3"><Badge tone={statusTone[invoice.status]}>{invoice.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {invoices.length === 100 && (
            <p className="border-t border-line px-5 py-3 text-xs text-ink-soft">Showing the 100 most recent invoices.</p>
          )}
        </Card>
      )}
    </>
  );
}
