import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { PAGE_SIZE } from "./constants";
import { isoOf, toUtcDate } from "./dates";
import { money } from "./format";
import { getToday } from "./today";
import type { PaymentFilters } from "./filters";
import type { PaymentInput } from "./validation";

export class PaymentError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public field?: string,
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

function paymentWhere(f: PaymentFilters): Prisma.PaymentWhereInput {
  const and: Prisma.PaymentWhereInput[] = [];
  if (f.method) and.push({ method: f.method });
  if (f.customerId) and.push({ invoice: { customerId: f.customerId } });
  if (f.q) {
    and.push({
      OR: [
        { invoice: { number: { contains: f.q, mode: "insensitive" } } },
        { invoice: { customer: { name: { contains: f.q, mode: "insensitive" } } } },
        { invoice: { customer: { email: { contains: f.q, mode: "insensitive" } } } },
      ],
    });
  }
  if (f.from || f.to) {
    and.push({
      paidOn: {
        ...(f.from ? { gte: toUtcDate(f.from) } : {}),
        ...(f.to ? { lte: toUtcDate(f.to) } : {}),
      },
    });
  }
  return { AND: and };
}

export async function listPayments(f: PaymentFilters) {
  const where = paymentWhere(f);
  const [rows, total, agg] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: [{ paidOn: "desc" }, { createdAt: "desc" }],
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        invoice: { select: { id: true, number: true, customer: { select: { id: true, name: true } } } },
      },
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ where, _sum: { amount: true } }),
  ]);

  return {
    items: rows.map((p) => ({
      id: p.id,
      paidOn: isoOf(p.paidOn),
      method: p.method,
      amount: Number(p.amount),
      note: p.note,
      invoiceId: p.invoice.id,
      invoiceNumber: p.invoice.number,
      customerId: p.invoice.customer.id,
      customerName: p.invoice.customer.name,
    })),
    total,
    sum: Number(agg._sum.amount ?? 0),
    page: f.page,
    pageSize: PAGE_SIZE,
  };
}

/**
 * Records a payment against an invoice.
 * - the invoice row is locked (FOR UPDATE) so two people paying at once can't overpay it
 * - the amount can't exceed the balance; the date can't be in the future
 * - invoice.amount_paid is kept in step, and the invoice flips to PAID when the balance reaches zero
 */
export async function recordPayment(input: PaymentInput, actorId?: string) {
  const today = await getToday();
  if (input.paidOn > today) {
    throw new PaymentError("FUTURE_DATE", "Payment date can't be in the future.", 422, "paidOn");
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${input.invoiceId}::uuid FOR UPDATE`;

    const invoice = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
    if (!invoice) throw new PaymentError("NOT_FOUND", "That invoice doesn't exist.", 404, "invoiceId");
    if (invoice.status === "DRAFT") {
      throw new PaymentError("DRAFT", "Confirm the invoice before recording a payment.", 422, "invoiceId");
    }
    if (invoice.status === "CANCELLED") {
      throw new PaymentError("CANCELLED", "This invoice is cancelled, so it can't take payments.", 422, "invoiceId");
    }
    if (invoice.status === "PAID") {
      throw new PaymentError("PAID", "This invoice is already fully paid.", 422, "invoiceId");
    }

    const amount = new Prisma.Decimal(input.amount.toFixed(2));
    const balance = invoice.total.minus(invoice.amountPaid);
    if (amount.gt(balance)) {
      throw new PaymentError("OVERPAY", `That's more than the balance of ${money(balance.toNumber())}.`, 422, "amount");
    }

    const payment = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        method: input.method,
        amount,
        paidOn: toUtcDate(input.paidOn),
        note: input.note,
        recordedById: actorId,
      },
    });

    const newPaid = invoice.amountPaid.plus(amount);
    const updated = await tx.invoice.update({
      where: { id: invoice.id },
      data: { amountPaid: newPaid, status: newPaid.gte(invoice.total) ? "PAID" : "CONFIRMED" },
    });

    return {
      payment: {
        id: payment.id,
        invoiceId: payment.invoiceId,
        method: payment.method,
        amount: amount.toNumber(),
        paidOn: input.paidOn,
        note: payment.note,
      },
      invoice: {
        id: updated.id,
        status: updated.status,
        amountPaid: updated.amountPaid.toNumber(),
        balance: updated.total.minus(updated.amountPaid).toNumber(),
      },
    };
  });
}
