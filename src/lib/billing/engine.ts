import { Prisma, type Discount } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getToday } from "@/lib/clock";
import { nextNumber } from "@/lib/sequence";
import { calculateTax } from "@/lib/catalog/tax";
import { getApplicableDiscounts } from "@/lib/catalog/discounts";
import { addDays, nextPeriodStart, periodEnd } from "./period";

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);
const MAX_CATCHUP_PERIODS = 24;

export type BillingResult = {
  today: string;
  activated: number;
  created: { subscription: string; invoice: string; periodStart: string }[];
  skippedDuplicates: number;
  closed: number;
  errors: { subscription: string; error: string }[];
};

type SubWithAll = Prisma.SubscriptionGetPayload<{ include: { plan: true; lines: true } }>;

/** Amount of a discount against a base, never more than the base. */
function discountAmount(d: Discount, base: Prisma.Decimal) {
  const raw = d.type === "PERCENTAGE" ? base.mul(d.value).div(100) : D(d.value);
  return Prisma.Decimal.min(raw, base).toDecimalPlaces(2);
}

/**
 * Build and persist ONE invoice for (subscription, periodStart) in a single transaction.
 * Returns null if that period is already invoiced (idempotent): the unique index
 * (subscriptionId, periodStart) is the final guard, so two concurrent runs cannot double-bill.
 */
export async function generateInvoice(sub: SubWithAll, periodStart: Date, today: Date) {
  const existing = await prisma.invoice.findUnique({
    where: { subscriptionId_periodStart: { subscriptionId: sub.id, periodStart } },
  });
  if (existing) return null;

  const pEnd = periodEnd(periodStart, sub.plan.billingPeriod);
  const subtotal = sub.lines.reduce((s, l) => s.add(l.amount), D(0));
  const discounts = await getApplicableDiscounts({
    date: today,
    subtotal,
    lines: sub.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, amount: l.amount })),
  });

  // discount allocated per line (product scope -> that product's lines; subscription scope -> pro rata)
  const lineDiscount = new Map<string, Prisma.Decimal>(sub.lines.map((l) => [l.id, D(0)]));
  const discountLines: { description: string; amount: Prisma.Decimal; discountId: string }[] = [];
  for (const d of discounts) {
    const scoped = d.scope === "PRODUCT" ? sub.lines.filter((l) => l.productId === d.productId) : sub.lines;
    const base = scoped.reduce((s, l) => s.add(l.amount), D(0));
    const amt = discountAmount(d, base);
    if (amt.lte(0)) continue;
    let allocated = D(0);
    scoped.forEach((l, i) => {
      const share = i === scoped.length - 1 ? amt.sub(allocated) : amt.mul(l.amount).div(base).toDecimalPlaces(2);
      allocated = allocated.add(share);
      lineDiscount.set(l.id, lineDiscount.get(l.id)!.add(share));
    });
    discountLines.push({ description: `Discount: ${d.name}`, amount: amt.neg(), discountId: d.id });
  }

  // tax is charged on the line amount AFTER its share of discount
  let taxTotal = D(0);
  const invoiceLines: Prisma.InvoiceLineCreateWithoutInvoiceInput[] = [];
  for (const l of sub.lines) {
    const net = Prisma.Decimal.max(l.amount.sub(lineDiscount.get(l.id)!), 0);
    const { ratePct, taxAmount } = await calculateTax(net, l.taxId);
    taxTotal = taxTotal.add(taxAmount);
    invoiceLines.push({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, taxPct: ratePct, taxAmount, amount: l.amount });
  }
  for (const dl of discountLines) {
    invoiceLines.push({ description: dl.description, quantity: 1, unitPrice: dl.amount, amount: dl.amount });
  }
  const discountTotal = discountLines.reduce((s, d) => s.add(d.amount.neg()), D(0));
  const total = subtotal.sub(discountTotal).add(taxTotal).toDecimalPlaces(2);

  try {
    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          number: await nextNumber(tx, "INV"),
          subscriptionId: sub.id,
          customerId: sub.customerId,
          periodStart,
          periodEnd: pEnd,
          issueDate: today,
          dueDate: addDays(today, sub.paymentTermsDays),
          subtotal,
          discountTotal,
          taxTotal,
          total,
          lines: { create: invoiceLines },
          redemptions: { create: discountLines.map((d) => ({ discountId: d.discountId })) },
        },
      });
      for (const d of discountLines) {
        // atomic guard so a usage limit can never be exceeded, even with concurrent runs
        const bumped = await tx.$executeRaw`
          UPDATE "Discount" SET "usedCount" = "usedCount" + 1
          WHERE "id" = ${d.discountId} AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")`;
        if (bumped === 0) throw new Error(`Discount ${d.discountId} usage limit reached`);
      }
      return invoice;
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return null; // lost a race: already billed
    throw e;
  }
}

/** Run billing for every due subscription as of the (possibly simulated) today. Safe to run repeatedly. */
export async function runBilling(): Promise<BillingResult> {
  const today = await getToday();
  const result: BillingResult = { today: today.toISOString().slice(0, 10), activated: 0, created: [], skippedDuplicates: 0, closed: 0, errors: [] };

  // 1. Confirmed subscriptions whose start date has arrived become Active (first invoice due at start date)
  result.activated = await prisma.$executeRaw`
    UPDATE "Subscription" SET "status" = 'ACTIVE', "nextInvoiceDate" = "startDate"
    WHERE "status" = 'CONFIRMED' AND "startDate" <= ${today}`;

  // 2. Bill everything due (catch up missed periods, bounded)
  const due = await prisma.subscription.findMany({
    where: { status: "ACTIVE", paused: false, nextInvoiceDate: { lte: today } },
    include: { plan: true, lines: true },
    orderBy: { nextInvoiceDate: "asc" },
  });

  for (const sub of due) {
    try {
      let cursor = sub.nextInvoiceDate!;
      let n = 0;
      while (cursor <= today && n++ < MAX_CATCHUP_PERIODS) {
        if (sub.expiryDate && cursor > sub.expiryDate) break;
        const inv = await generateInvoice(sub, cursor, today);
        if (inv) result.created.push({ subscription: sub.number, invoice: inv.number, periodStart: cursor.toISOString().slice(0, 10) });
        else result.skippedDuplicates++;
        cursor = nextPeriodStart(cursor, sub.plan.billingPeriod);
      }
      const finished = sub.expiryDate && cursor > sub.expiryDate && sub.plan.autoClose;
      await prisma.subscription.update({
        where: { id: sub.id },
        data: finished ? { status: "CLOSED", nextInvoiceDate: null } : { nextInvoiceDate: cursor },
      });
      if (finished) result.closed++;
    } catch (e) {
      result.errors.push({ subscription: sub.number, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return result;
}
