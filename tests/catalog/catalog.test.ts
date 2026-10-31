// Run: npx tsx --test tests/catalog/catalog.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateTax, calculateLinesTax } from "../../src/lib/catalog/tax";
import { evaluateDiscounts, type DiscountRule } from "../../src/lib/catalog/discount-rules";
import { addBillingPeriod, computeUnitPrice, isPlanAvailable } from "../../src/lib/catalog/plans";

const rule = (o: Partial<DiscountRule> = {}): DiscountRule => ({
  id: "d1", name: "Test", type: "PERCENTAGE", value: 10, scope: "SUBSCRIPTION", productId: null,
  minPurchaseAmount: null, minQuantity: null, startDate: new Date("2026-01-01"), endDate: null,
  usageLimit: null, timesUsed: 0, active: true, ...o,
});
const lines = [{ productId: "p1", quantity: 5, amount: 5000 }, { productId: "p2", quantity: 1, amount: 1000 }];
const on = new Date("2026-10-31");

test("tax", () => {
  assert.deepEqual(calculateTax(1000, 18), { net: 1000, tax: 180, gross: 1180 });
  assert.equal(calculateTax(99.99, 5).tax, 5);
  const r = calculateLinesTax([{ quantity: 2, unitPrice: 500, discount: 100, taxRatePercent: 18 }]);
  assert.equal(r.subtotal, 900); assert.equal(r.taxTotal, 162); assert.equal(r.total, 1062);
});

test("variant adds 560", () => assert.equal(computeUnitPrice(1000, 560), 1560));

test("percentage subscription discount + min quantity", () => {
  assert.equal(evaluateDiscounts([rule({ minQuantity: 5 })], lines, on).totalDiscount, 600);
  assert.equal(evaluateDiscounts([rule({ minQuantity: 7 })], lines, on).totalDiscount, 0);
});

test("product scope only counts that product", () => {
  const r = rule({ scope: "PRODUCT", productId: "p2" });
  assert.equal(evaluateDiscounts([r], lines, on).totalDiscount, 100);
});

test("expiry, end date inclusive, usage limit, inactive", () => {
  assert.equal(evaluateDiscounts([rule({ endDate: new Date("2026-10-30") })], lines, on).totalDiscount, 0);
  assert.equal(evaluateDiscounts([rule({ endDate: new Date("2026-10-31") })], lines, on).totalDiscount, 600);
  assert.equal(evaluateDiscounts([rule({ usageLimit: 3, timesUsed: 3 })], lines, on).totalDiscount, 0);
  assert.equal(evaluateDiscounts([rule({ active: false })], lines, on).totalDiscount, 0);
  assert.equal(evaluateDiscounts([rule({ startDate: new Date("2026-11-01") })], lines, on).totalDiscount, 0);
});

test("fixed discount never exceeds subtotal", () => {
  assert.equal(evaluateDiscounts([rule({ type: "FIXED", value: 99999 })], lines, on).totalDiscount, 6000);
});

test("billing period math and availability", () => {
  assert.equal(addBillingPeriod(new Date("2026-01-31T00:00:00Z"), "MONTHLY").toISOString().slice(0, 10), "2026-02-28");
  assert.equal(addBillingPeriod(new Date("2026-10-31T00:00:00Z"), "YEARLY").toISOString().slice(0, 10), "2027-10-31");
  assert.equal(addBillingPeriod(new Date("2026-10-31T00:00:00Z"), "WEEKLY").toISOString().slice(0, 10), "2026-11-07");
  assert.equal(isPlanAvailable({ availableFrom: null, availableTo: new Date("2026-10-30") }, on), false);
});
