import Link from "next/link";
import { AsyncPicker } from "@/components/AsyncPicker";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { requireRole } from "@/lib/auth";
import { INVOICE_STATUS_FILTERS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { parseInvoiceFilters, type SP } from "@/lib/filters";
import { formatDate, money } from "@/lib/format";
import { listInvoices } from "@/lib/invoices";
import { getTodayInfo } from "@/lib/today";

export const dynamic = "force-dynamic";

export default async function InvoicesPage({ searchParams }: { searchParams: SP }) {
  await requireRole(["ADMIN", "STAFF"]);
  const { date: today } = await getTodayInfo();
  const filters = parseInvoiceFilters(searchParams);

  const customer = filters.customerId
    ? await prisma.user.findUnique({ where: { id: filters.customerId }, select: { id: true, name: true, email: true } })
    : null;
  const result = await listInvoices({ ...filters, customerId: customer ? customer.id : undefined }, today);

  const params = {
    q: filters.q,
    status: filters.status === "all" ? undefined : filters.status,
    customerId: customer ? customer.id : undefined,
    from: filters.from,
    to: filters.to,
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Invoices" subtitle="See which invoices are paid, outstanding or overdue, and open one to record a payment." />

      <form method="get" className="panel mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="q" className="mb-1 block text-sm font-medium">
            Search
          </label>
          <input id="q" name="q" defaultValue={filters.q} placeholder="Invoice number, name or email" className="field" />
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select id="status" name="status" defaultValue={filters.status} className="field">
            {INVOICE_STATUS_FILTERS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Customer</label>
          <AsyncPicker
            endpoint="/api/customers"
            name="customerId"
            placeholder="All customers"
            initial={customer ? { id: customer.id, label: customer.name, sub: customer.email } : null}
          />
        </div>
        <div>
          <label htmlFor="from" className="mb-1 block text-sm font-medium">
            Issued from
          </label>
          <input id="from" name="from" type="date" defaultValue={filters.from} className="field" />
        </div>
        <div>
          <label htmlFor="to" className="mb-1 block text-sm font-medium">
            Issued to
          </label>
          <input id="to" name="to" type="date" defaultValue={filters.to} className="field" />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2">
          <button type="submit" className="btn-primary">
            Apply filters
          </button>
          <Link href="/invoices" className="btn-quiet">
            Reset
          </Link>
        </div>
      </form>

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem]">
            <thead>
              <tr className="border-b border-line">
                <th className="th">Invoice</th>
                <th className="th">Customer</th>
                <th className="th">Issued</th>
                <th className="th">Due</th>
                <th className="th text-right">Total</th>
                <th className="th text-right">Paid</th>
                <th className="th text-right">Balance</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.items.map((inv) => (
                <tr key={inv.id} className="hover:bg-canvas/60">
                  <td className="td">
                    <Link href={`/invoices/${inv.id}`} className="font-medium text-brand-dark hover:underline">
                      {inv.number}
                    </Link>
                  </td>
                  <td className="td">
                    <p>{inv.customerName}</p>
                    <p className="text-xs text-ink-soft">{inv.customerEmail}</p>
                  </td>
                  <td className="td">{formatDate(inv.issueDate)}</td>
                  <td className="td">{formatDate(inv.dueDate)}</td>
                  <td className="td text-right tabular-nums">{money(inv.total)}</td>
                  <td className="td text-right tabular-nums">{money(inv.amountPaid)}</td>
                  <td className="td text-right font-medium tabular-nums">{inv.display === "paid" || inv.display === "cancelled" ? "–" : money(inv.balance)}</td>
                  <td className="td">
                    <StatusBadge status={inv.display} />
                  </td>
                </tr>
              ))}
              {result.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-ink-soft">
                    No invoices match these filters. Clear a filter or widen the date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={result.page} pageSize={result.pageSize} total={result.total} basePath="/invoices" params={params} />
      </section>
    </div>
  );
}
