// DB-backed discount functions for Kareena's billing engine.
import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { evaluateDiscounts, type DiscountRule, type PricingLine } from "./discount-rules";

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Discounts that apply to these lines on `on` (pass the SIMULATED date from the demo button).
 * lines: [{ productId, quantity, amount: quantity * unitPrice }]
 * Returns { applied: [{discountId, name, amount, ...}], subtotal, totalDiscount }
 */
export async function getApplicableDiscounts(lines: PricingLine[], on: Date = new Date(), db: Db = prisma) {
  const productIds = [...new Set(lines.map((l) => l.productId))];
  const startOfDay = new Date(Date.UTC(on.getUTCFullYear(), on.getUTCMonth(), on.getUTCDate()));

  const rows = await db.discount.findMany({
    where: {
      active: true,
      startDate: { lte: on },
      AND: [
        { OR: [{ endDate: null }, { endDate: { gte: startOfDay } }] },
        { OR: [{ scope: "SUBSCRIPTION" }, { productId: { in: productIds } }] },
      ],
    },
  });

  const rules: DiscountRule[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    value: Number(r.value),
    scope: r.scope,
    productId: r.productId,
    minPurchaseAmount: r.minPurchaseAmount == null ? null : Number(r.minPurchaseAmount),
    minQuantity: r.minQuantity,
    startDate: r.startDate,
    endDate: r.endDate,
    usageLimit: r.usageLimit,
    timesUsed: r.timesUsed,
    active: r.active,
  }));
  return evaluateDiscounts(rules, lines, on);
}

/**
 * Call inside the SAME transaction that creates the invoice, once per applied discount.
 * Atomic: returns false (and changes nothing) if the usage limit was just reached by someone else.
 */
export async function recordDiscountUsage(discountId: string, db: Db = prisma): Promise<boolean> {
  const n = await db.$executeRaw`
    UPDATE "discounts" SET "timesUsed" = "timesUsed" + 1
    WHERE "id" = ${discountId} AND ("usageLimit" IS NULL OR "timesUsed" < "usageLimit")`;
  return n === 1;
}
