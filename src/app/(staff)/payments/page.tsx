import { Card, EmptyState, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { fmtDate, money } from "@/lib/utils";

export const metadata = { title: "Payments — Brightloop" };
export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  await requireRole("ADMIN", "STAFF");
  const payments = await prisma.payment.findMany({
    include: { invoice: { include: { customer: { select: { name: true, email: true } } } } },
    orderBy: { paidOn: "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeader title="Payments" subtitle="Review payments recorded against customer invoices." />
      {payments.length === 0 ? (
        <EmptyState title="No payments yet" body="Recorded payments will appear here once they are applied to an invoice." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-line bg-paper text-xs text-ink-soft">
                <tr>
                  {["Invoice", "Customer", "Method", "Paid on", "Amount", "Note"].map((heading) => (
                    <th key={heading} className="px-5 py-3 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-5 py-3 font-medium">{payment.invoice.number}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{payment.invoice.customer.name}</div>
                      <div className="text-xs text-ink-soft">{payment.invoice.customer.email}</div>
                    </td>
                    <td className="px-5 py-3">{payment.method}</td>
                    <td className="px-5 py-3 text-ink-soft">{fmtDate(payment.paidOn)}</td>
                    <td className="px-5 py-3 font-medium tabular-nums">{money(Number(payment.amount))}</td>
                    <td className="px-5 py-3 text-ink-soft">{payment.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {payments.length === 100 && (
            <p className="border-t border-line px-5 py-3 text-xs text-ink-soft">Showing the 100 most recent payments.</p>
          )}
        </Card>
      )}
    </>
  );
}
