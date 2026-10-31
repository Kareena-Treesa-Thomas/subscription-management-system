// Public API of the catalog module — import from "@/lib/catalog".
export { calculateTax, calculateLinesTax, round2 } from "./tax";
export type { TaxableLine, TaxedLine } from "./tax";
export { getApplicableDiscounts, recordDiscountUsage } from "./discounts";
export { evaluateDiscounts } from "./discount-rules";
export type { PricingLine, AppliedDiscount, DiscountRule } from "./discount-rules";
export { getProductPricing } from "./pricing";
export { addBillingPeriod, isPlanAvailable, meetsMinQuantity, planAllows, computeUnitPrice } from "./plans";
export type { PlanRules, BillingPeriodName } from "./plans";
