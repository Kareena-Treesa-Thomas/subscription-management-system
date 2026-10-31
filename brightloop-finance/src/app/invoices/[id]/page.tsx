import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { RecordPaymentForm } from "@/components/RecordPaymentForm";
import { StatusBadge } from "@/components/StatusBadge";
import { requireRole } from "@/lib/auth";
import { METHOD_LABELS, type PaymentMethodValue } from "@/lib/constants";
import { uuidOrUndefined } from "@/lib/filters";
import { formatDate, money } from "@/lib/format";
import { getInvoiceDetail } from "@/lib/invoices";
import { getTodayInfo } from "@/lib/today";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  await requireRole(["ADMIN", "STAFF"]);
  const id = uuidOrUndefined(params.id);
  if (!id) notFound();
  const { date: today } = await getTodayInfo();
  const inv = await getInvoiceDetail(id, today);
  if (!inv) notFound();

  const canPay = inv.status === "CONFIRMED" && inv.balance > 0;
  const blockedReason =
    inv.status === "PAID"
      ? "This invoice is fully paid."
      : inv.status === "DRAFT"
        ? "Confirm this invoice before recording a payment."
        : inv.status === "CANCELLED"
          ? "This invoice is cancelled, so it can't take payments."
          : null;

  return (
    <div className="mx-auto max-w-4xl">
      <p className="mb-3 text-sm">
        <Link href="/invoices" className="text-brand-dark hover:underline">
          Invoices
        </Link>
        <span className="text-ink-faint"> / </span>
        <span className="text-ink-soft">{inv.number}</span>
      </p>
      <PageHeader title={inv.number} subtitle={`${inv.customer.name} · subscription ${inv.subscriptionNumber}`}>
        <StatusBadge status={inv.display} />
      </PageHeader>

      <section className="panel mb-6 grid gap-6 p-5 sm:grid-cols-2">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Customer</dt>
            <dd className="text-right">
              <Link href={`/invoices?customerId=${inv.customer.id}`} className="font-medium text-brand-dark hover:underline">
                {inv.customer.name}
              </Link>
              <p className="text-xs text-ink-soft">{inv.customer.email}</p>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Billing period</dt>
            <dd>
              {formatDate(inv.periodStart)} to {formatDate(inv.periodEnd)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Issued</dt>
            <dd>{formatDate(inv.issueDate)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Due</dt>
            <dd>{formatDate(inv.dueDate)}</dd>
          </div>
        </dl>
        <dl className="space-y-2 text-sm tabular-nums">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd>{money(inv.subtotal)}</dd>
          </div>
          {inv.discountTotal > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-soft">Discount</dt>
              <dd>−{money(inv.discountTotal)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-ink-soft">Tax</dt>
            <dd>{money(inv.taxTotal)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 font-semibold">
            <dt>Total</dt>
            <dd>{money(inv.total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Paid so far</dt>
            <dd>{money(inv.amountPaid)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Balance</dt>
            <dd>{money(inv.balance)}</dd>
          </div>
        </dl>
      </section>

      {inv.lines.length > 0 && (
        <section className="panel mb-6 overflow-hidden">
          <h2 className="p-5 pb-3 text-lg font-semibold">Lines</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem]">
              <thead>
                <tr className="border-y border-line">
                  <th className="th">Item</th>
                  <th className="th text-right">Qty</th>
                  <th className="th text-right">Unit price</th>
                  <th className="th text-right">Tax</th>
                  <th className="th text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {inv.lines.map((l) => (
                  <tr key={l.id}>
                    <td className="td">{l.description}</td>
                    <td className="td text-right tabular-nums">{l.quantity}</td>
                    <td className="td text-right tabular-nums">{money(l.unitPrice)}</td>
                    <td className="td text-right tabular-nums">{money(l.taxAmount)}</td>
                    <td className="td text-right tabular-nums">{money(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="panel mb-6 overflow-hidden">
        <h2 className="p-5 pb-3 text-lg font-semibold">Payments</h2>
        {inv.payments.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-ink-soft">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem]">
              <thead>
                <tr className="border-y border-line">
                  <th className="th">Date</th>
                  <th className="th">Method</th>
                  <th className="th">Note</th>
                  <th className="th text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {inv.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="td">{formatDate(p.paidOn)}</td>
                    <td className="td">{METHOD_LABELS[p.method as PaymentMethodValue] ?? p.method}</td>
                    <td className="td max-w-xs truncate text-ink-soft">{p.note ?? "–"}</td>
                    <td className="td text-right tabular-nums">{money(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel p-5">
        <h2 className="mb-4 text-lg font-semibold">Record a payment</h2>
        {canPay ? (
          <RecordPaymentForm today={today} invoice={{ id: inv.id, number: inv.number, balance: inv.balance }} />
        ) : (
          <p className="text-sm text-ink-soft">{blockedReason}</p>
        )}
      </section>
    </div>
  );
}
