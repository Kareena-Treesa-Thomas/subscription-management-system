import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { PAGE_SIZE } from "./constants";
import { isoOf, toUtcDate } from "./dates";
import { displayStatus, type DisplayStatus } from "./status";
import type { InvoiceFilters } from "./filters";

const num = (v: Prisma.Decimal | number | null | undefined) => Number(v ?? 0);

export type InvoiceRow = {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  total: number;
  amountPaid: number;
  balance: number;
  status: string;
  display: DisplayStatus;
};

function invoiceWhere(f: InvoiceFilters, today: string): Prisma.InvoiceWhereInput {
  const and: Prisma.InvoiceWhereInput[] = [];
  const t = toUtcDate(today);
  switch (f.status) {
    case "unpaid":
      and.push({ status: "CONFIRMED" });
      break;
    case "outstanding":
      and.push({ status: "CONFIRMED", dueDate: { gte: t } });
      break;
    case "overdue":
      and.push({ status: "CONFIRMED", dueDate: { lt: t } });
      break;
    case "paid":
      and.push({ status: "PAID" });
      break;
    case "draft":
      and.push({ status: "DRAFT" });
      break;
    case "cancelled":
      and.push({ status: "CANCELLED" });
      break;
  }
  if (f.customerId) and.push({ customerId: f.customerId });
  if (f.q) {
    and.push({
      OR: [
        { number: { contains: f.q, mode: "insensitive" } },
        { customer: { name: { contains: f.q, mode: "insensitive" } } },
        { customer: { email: { contains: f.q, mode: "insensitive" } } },
      ],
    });
  }
  if (f.from || f.to) {
    and.push({
      issueDate: {
        ...(f.from ? { gte: toUtcDate(f.from) } : {}),
        ...(f.to ? { lte: toUtcDate(f.to) } : {}),
      },
    });
  }
  return { AND: and };
}

export async function listInvoices(f: InvoiceFilters, today: string) {
  const where = invoiceWhere(f, today);
  const [rows, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: [{ issueDate: "desc" }, { number: "desc" }],
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { customer: { select: { name: true, email: true } } },
    }),
    prisma.invoice.count({ where }),
  ]);

  const items: InvoiceRow[] = rows.map((r) => {
    const dueDate = isoOf(r.dueDate);
    const amountPaid = num(r.amountPaid);
    return {
      id: r.id,
      number: r.number,
      customerName: r.customer.name,
      customerEmail: r.customer.email,
      issueDate: isoOf(r.issueDate),
      dueDate,
      total: num(r.total),
      amountPaid,
      balance: num(r.total) - amountPaid,
      status: r.status,
      display: displayStatus(r.status, dueDate, today, amountPaid),
    };
  });

  return { items, total, page: f.page, pageSize: PAGE_SIZE };
}

export async function getInvoiceDetail(id: string, today: string) {
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true, company: true } },
      subscription: { select: { number: true } },
      lines: true,
      payments: { orderBy: [{ paidOn: "desc" }, { createdAt: "desc" }] },
    },
  });
  if (!inv) return null;

  const dueDate = isoOf(inv.dueDate);
  const amountPaid = num(inv.amountPaid);
  return {
    id: inv.id,
    number: inv.number,
    status: inv.status,
    display: displayStatus(inv.status, dueDate, today, amountPaid),
    customer: inv.customer,
    subscriptionNumber: inv.subscription.number,
    periodStart: isoOf(inv.periodStart),
    periodEnd: isoOf(inv.periodEnd),
    issueDate: isoOf(inv.issueDate),
    dueDate,
    subtotal: num(inv.subtotal),
    discountTotal: num(inv.discountTotal),
    taxTotal: num(inv.taxTotal),
    total: num(inv.total),
    amountPaid,
    balance: num(inv.total) - amountPaid,
    lines: inv.lines.map((l) => ({
      id: l.id,
      description: l.description,
      quantity: l.quantity,
      unitPrice: num(l.unitPrice),
      taxAmount: num(l.taxAmount),
      amount: num(l.amount),
    })),
    payments: inv.payments.map((p) => ({
      id: p.id,
      method: p.method,
      amount: num(p.amount),
      paidOn: isoOf(p.paidOn),
      note: p.note,
    })),
  };
}
