import Link from "next/link";
import { AsyncPicker } from "@/components/AsyncPicker";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { RecordPaymentForm } from "@/components/RecordPaymentForm";
import { requireRole } from "@/lib/auth";
import { METHOD_LABELS, PAYMENT_METHODS, type PaymentMethodValue } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { parsePaymentFilters, type SP } from "@/lib/filters";
import { formatDate, money } from "@/lib/format";
import { listPayments } from "@/lib/payments";
import { getTodayInfo } from "@/lib/today";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({ searchParams }: { searchParams: SP }) {
  await requireRole(["ADMIN", "STAFF"]);
  const { date: today } = await getTodayInfo();
  const filters = parsePaymentFilters(searchParams);

  const customer = filters.customerId
    ? await prisma.user.findUnique({ where: { id: filters.customerId }, select: { id: true, name: true, email: true } })
    : null;
  const result = await listPayments({ ...filters, customerId: customer ? customer.id : undefined });

  const params = {
    q: filters.q,
    method: filters.method,
    customerId: customer ? customer.id : undefined,
    from: filters.from,
    to: filters.to,
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Payments" subtitle="Every payment received, with the invoice it was recorded against." />

      <details className="panel mb-6 p-5">
        <summary className="cursor-pointer text-lg font-semibold">Record a payment</summary>
        <div className="mt-4">
          <RecordPaymentForm today={today} />
        </div>
      </details>

      <form method="get" className="panel mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="q" className="mb-1 block text-sm font-medium">
            Search
          </label>
          <input id="q" name="q" defaultValue={filters.q} placeholder="Invoice number, name or email" className="field" />
        </div>
        <div>
          <label htmlFor="method" className="mb-1 block text-sm font-medium">
            Method
          </label>
          <select id="method" name="method" defaultValue={filters.method ?? ""} className="field">
            <option value="">All methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABELS[m]}
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
            Paid from
          </label>
          <input id="from" name="from" type="date" defaultValue={filters.from} className="field" />
        </div>
        <div>
          <label htmlFor="to" className="mb-1 block text-sm font-medium">
            Paid to
          </label>
          <input id="to" name="to" type="date" defaultValue={filters.to} className="field" />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2">
          <button type="submit" className="btn-primary">
            Apply filters
          </button>
          <Link href="/payments" className="btn-quiet">
            Reset
          </Link>
        </div>
      </form>

      <section className="panel overflow-hidden">
        <p className="px-5 py-3 text-sm text-ink-soft">
          {result.total.toLocaleString("en-IN")} payments totalling <span className="font-medium text-ink">{money(result.sum)}</span>
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem]">
            <thead>
              <tr className="border-y border-line">
                <th className="th">Date</th>
                <th className="th">Invoice</th>
                <th className="th">Customer</th>
                <th className="th">Method</th>
                <th className="th">Note</th>
                <th className="th text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.items.map((p) => (
                <tr key={p.id} className="hover:bg-canvas/60">
                  <td className="td">{formatDate(p.paidOn)}</td>
                  <td className="td">
                    <Link href={`/invoices/${p.invoiceId}`} className="font-medium text-brand-dark hover:underline">
                      {p.invoiceNumber}
                    </Link>
                  </td>
                  <td className="td">{p.customerName}</td>
                  <td className="td">{METHOD_LABELS[p.method as PaymentMethodValue] ?? p.method}</td>
                  <td className="td max-w-[14rem] truncate text-ink-soft">{p.note ?? "–"}</td>
                  <td className="td text-right font-medium tabular-nums">{money(p.amount)}</td>
                </tr>
              ))}
              {result.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-soft">
                    No payments match these filters. Clear a filter or widen the date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={result.page} pageSize={result.pageSize} total={result.total} basePath="/payments" params={params} />
      </section>
    </div>
  );
}
