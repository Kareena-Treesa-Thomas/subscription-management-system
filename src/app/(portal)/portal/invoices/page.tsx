import { Badge, Card, EmptyState, PageHeader, statusTone } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { fmtDate, money } from "@/lib/utils";

export const metadata = { title: "My invoices - Brightloop" };
export const dynamic = "force-dynamic";
const PAGE_SIZE = 10;

export default async function PortalInvoices({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireRole("CUSTOMER");
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const where = { customerId: user.id, status: { not: "DRAFT" as const } }; // customers never see drafts

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({ where, orderBy: { dueDate: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { subscription: { select: { number: true } } } }),
    prisma.invoice.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const now = new Date();

  return (
    <>
      <PageHeader title="My invoices" subtitle="Everything billed to your account, with due dates and status." />
      {invoices.length === 0 ? (
        <EmptyState title="No invoices yet" body="Invoices appear here after your subscription is billed." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-paper text-xs text-ink-soft">
                <tr>
                  {["Invoice", "Subscription", "Period", "Due", "Total", "Status"].map((h, i) => (
                    <th key={h} className={`px-5 py-3 font-medium ${h === "Total" ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {invoices.map((inv) => {
                  const overdue = inv.status === "CONFIRMED" && inv.dueDate < now;
                  return (
                    <tr key={inv.id}>
                      <td className="px-5 py-3 font-medium">{inv.number}</td>
                      <td className="px-5 py-3 text-ink-soft">{inv.subscription.number}</td>
                      <td className="px-5 py-3 text-ink-soft">{fmtDate(inv.periodStart)} ΓÇô {fmtDate(inv.periodEnd)}</td>
                      <td className="px-5 py-3 text-ink-soft">{fmtDate(inv.dueDate)}</td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums">{money(Number(inv.total))}</td>
                      <td className="px-5 py-3">
                        <Badge tone={overdue ? "red" : statusTone[inv.status]}>{overdue ? "Overdue" : inv.status === "CONFIRMED" ? "Unpaid" : inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
              <span className="text-ink-soft">Page {page} of {pages}</span>
              <div className="flex gap-2">
                {page > 1 && <a className="rounded-lg border border-line px-3 py-1.5 hover:bg-slate-50" href={`?page=${page - 1}`}>Previous</a>}
                {page < pages && <a className="rounded-lg border border-line px-3 py-1.5 hover:bg-slate-50" href={`?page=${page + 1}`}>Next</a>}
              </div>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
