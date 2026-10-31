import { prisma, type Tx } from "@/lib/prisma";
import { HttpError } from "@/lib/http";

export async function confirmInvoice(id: string) {
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) throw new HttpError(404, "Invoice not found");
  if (inv.status !== "DRAFT") throw new HttpError(409, `Only draft invoices can be confirmed (is ${inv.status})`);
  return prisma.invoice.update({ where: { id }, data: { status: "CONFIRMED" } });
}

export async function cancelInvoice(id: string) {
  return prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.findUnique({ where: { id }, include: { payments: true } });
    if (!inv) throw new HttpError(404, "Invoice not found");
    if (inv.status === "PAID" || inv.status === "CANCELLED") throw new HttpError(409, `Cannot cancel a ${inv.status} invoice`);
    if (inv.payments.length) throw new HttpError(409, "Invoice has payments; cannot cancel");
    // give discount uses back; the invoice row stays so (subscription, period) is never silently re-billed
    const reds = await tx.discountRedemption.findMany({ where: { invoiceId: id } });
    for (const r of reds) await tx.discount.update({ where: { id: r.discountId }, data: { usedCount: { decrement: 1 } } });
    await tx.discountRedemption.deleteMany({ where: { invoiceId: id } });
    return tx.invoice.update({ where: { id }, data: { status: "CANCELLED" } });
  });
}

export async function sendInvoice(id: string) {
  const inv = await prisma.invoice.findUnique({ where: { id }, include: { customer: true } });
  if (!inv) throw new HttpError(404, "Invoice not found");
  if (inv.status === "DRAFT" || inv.status === "CANCELLED") throw new HttpError(409, "Confirm the invoice before sending");
  // Offline-friendly: log instead of requiring SMTP. Swap in Resend/SMTP when configured.
  console.log(`[email] Invoice ${inv.number} (${inv.total}) -> ${inv.customer.email}`);
  return prisma.invoice.update({ where: { id }, data: { sentAt: new Date() } });
}

/**
 * HAND-OFF to Shivani: call inside her payment transaction after inserting a Payment.
 * Recomputes amountPaid and flips CONFIRMED -> PAID once fully settled.
 */
export async function refreshInvoicePaidStatus(tx: Tx, invoiceId: string) {
  const agg = await tx.payment.aggregate({ where: { invoiceId }, _sum: { amount: true } });
  const paid = agg._sum.amount ?? 0;
  const inv = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  const settled = inv.total.lte(paid);
  return tx.invoice.update({
    where: { id: invoiceId },
    data: { amountPaid: paid, status: settled && inv.status === "CONFIRMED" ? "PAID" : inv.status },
  });
}
