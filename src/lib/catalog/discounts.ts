// CONTRACT with Athira-Maria. This default works so billing can be tested; she can harden it.
// It only decides WHICH discounts apply. The billing engine computes the amounts.
import { Prisma, type Discount } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DiscountContext = {
  date: Date; // invoice date (simulated "today")
  subtotal: Prisma.Decimal; // pre-tax, pre-discount
  lines: { productId: string; quantity: number; amount: Prisma.Decimal }[];
};

export async function getApplicableDiscounts(ctx: DiscountContext): Promise<Discount[]> {
  const candidates = await prisma.discount.findMany({
    where: { active: true, startDate: { lte: ctx.date }, endDate: { gte: ctx.date } },
  });
  return candidates.filter((d) => {
    if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return false;
    const scoped = d.scope === "PRODUCT" ? ctx.lines.filter((l) => l.productId === d.productId) : ctx.lines;
    if (scoped.length === 0) return false;
    const amount = scoped.reduce((s, l) => s.add(l.amount), new Prisma.Decimal(0));
    const qty = scoped.reduce((s, l) => s + l.quantity, 0);
    if (d.minPurchase && amount.lt(d.minPurchase)) return false;
    if (d.minQuantity && qty < d.minQuantity) return false;
    return true;
  });
}

export async function recordDiscountUsage(discountId: string, db: Prisma.TransactionClient | typeof prisma = prisma) {
  return db.discount.update({ where: { id: discountId }, data: { usedCount: { increment: 1 } } });
}
