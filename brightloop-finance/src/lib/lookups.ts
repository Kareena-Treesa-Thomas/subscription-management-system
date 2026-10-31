import { prisma } from "./db";
import { isoOf } from "./dates";
import { formatDate, money } from "./format";

export type LookupItem = { id: string; label: string; sub?: string; balance?: number };

export async function lookupCustomers(q: string): Promise<LookupItem[]> {
  const rows = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: { name: "asc" },
    take: 8,
    select: { id: true, name: true, email: true },
  });
  return rows.map((r) => ({ id: r.id, label: r.name, sub: r.email }));
}

/** Confirmed invoices that still have a balance: the ones a payment can be recorded against. */
export async function lookupOpenInvoices(q: string): Promise<LookupItem[]> {
  const rows = await prisma.invoice.findMany({
    where: {
      status: "CONFIRMED",
      ...(q
        ? {
            OR: [
              { number: { contains: q, mode: "insensitive" } },
              { customer: { name: { contains: q, mode: "insensitive" } } },
              { customer: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: [{ dueDate: "asc" }, { number: "asc" }],
    take: 8,
    include: { customer: { select: { name: true } } },
  });
  return rows.map((r) => {
    const balance = Number(r.total) - Number(r.amountPaid);
    return {
      id: r.id,
      label: r.number,
      sub: `${r.customer.name} · owes ${money(balance)} · due ${formatDate(isoOf(r.dueDate))}`,
      balance,
    };
  });
}
