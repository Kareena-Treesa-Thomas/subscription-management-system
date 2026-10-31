// Pure discount engine. The DB wrapper lives in discounts.ts.
import { round2 } from "./tax";

export type DiscountRule = {
  id: string;
  name: string;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  scope: "PRODUCT" | "SUBSCRIPTION";
  productId: string | null;
  minPurchaseAmount: number | null;
  minQuantity: number | null;
  startDate: Date;
  endDate: Date | null;
  usageLimit: number | null;
  timesUsed: number;
  active: boolean;
};

/** amount = quantity * unitPrice, before discount and tax */
export type PricingLine = { productId: string; quantity: number; amount: number };

export type AppliedDiscount = {
  discountId: string;
  name: string;
  type: "FIXED" | "PERCENTAGE";
  scope: "PRODUCT" | "SUBSCRIPTION";
  productId: string | null;
  amount: number;
};

const DAY = 24 * 60 * 60 * 1000;

/** Active, inside its date window (end date is inclusive) and not out of uses. */
export function isRuleLive(r: DiscountRule, on: Date): boolean {
  if (!r.active) return false;
  if (r.startDate.getTime() > on.getTime()) return false;
  if (r.endDate && on.getTime() >= r.endDate.getTime() + DAY) return false;
  if (r.usageLimit != null && r.timesUsed >= r.usageLimit) return false;
  return true;
}

export function evaluateDiscounts(rules: DiscountRule[], lines: PricingLine[], on: Date = new Date()) {
  const subtotal = round2(lines.reduce((s, l) => s + l.amount, 0));
  let remaining = subtotal;
  const applied: AppliedDiscount[] = [];

  // Deterministic order: product-scoped first, then whole-subscription
  const ordered = [...rules].sort(
    (a, b) => (a.scope === b.scope ? 0 : a.scope === "PRODUCT" ? -1 : 1) || a.id.localeCompare(b.id),
  );

  for (const r of ordered) {
    if (!isRuleLive(r, on)) continue;
    const scoped = r.scope === "PRODUCT" ? lines.filter((l) => l.productId === r.productId) : lines;
    if (scoped.length === 0) continue;

    const baseAmount = scoped.reduce((s, l) => s + l.amount, 0);
    const baseQty = scoped.reduce((s, l) => s + l.quantity, 0);
    if (r.minPurchaseAmount != null && baseAmount < r.minPurchaseAmount) continue;
    if (r.minQuantity != null && baseQty < r.minQuantity) continue;

    const raw = r.type === "PERCENTAGE" ? (baseAmount * r.value) / 100 : r.value;
    const amount = round2(Math.min(raw, baseAmount, remaining)); // never discount below zero
    if (amount <= 0) continue;

    remaining = round2(remaining - amount);
    applied.push({
      discountId: r.id,
      name: r.name,
      type: r.type,
      scope: r.scope,
      productId: r.productId,
      amount,
    });
  }
  return { applied, subtotal, totalDiscount: round2(subtotal - remaining) };
}
