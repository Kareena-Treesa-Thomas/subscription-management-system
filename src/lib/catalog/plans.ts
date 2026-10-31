// Pure plan helpers (also useful for Anjanapriya's portal buttons and Kareena's billing).

export type BillingPeriodName = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type PlanRules = {
  minQuantity: number;
  availableFrom: Date | null;
  availableTo: Date | null;
  autoCloseAtEnd: boolean;
  closableEarly: boolean;
  pausable: boolean;
  renewable: boolean;
};

export const computeUnitPrice = (salesPrice: number, extraPrice = 0) =>
  Math.round((salesPrice + extraPrice + Number.EPSILON) * 100) / 100;

export function isPlanAvailable(plan: Pick<PlanRules, "availableFrom" | "availableTo">, on: Date = new Date()) {
  if (plan.availableFrom && on < plan.availableFrom) return false;
  if (plan.availableTo && on.getTime() >= plan.availableTo.getTime() + 24 * 60 * 60 * 1000) return false;
  return true;
}

export const meetsMinQuantity = (plan: Pick<PlanRules, "minQuantity">, qty: number) => qty >= plan.minQuantity;

/** Drives portal buttons: can the customer pause / close / renew on this plan? */
export function planAllows(plan: PlanRules, action: "pause" | "close" | "renew") {
  if (action === "pause") return plan.pausable;
  if (action === "close") return plan.closableEarly;
  return plan.renewable;
}

function addMonths(d: Date, n: number) {
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last)); // Jan 31 + 1 month = Feb 28/29
  return d;
}

/** Next period start/end helper for Kareena's billing engine (UTC). */
export function addBillingPeriod(date: Date, period: BillingPeriodName, count = 1): Date {
  const d = new Date(date.getTime());
  switch (period) {
    case "DAILY":
      d.setUTCDate(d.getUTCDate() + count);
      return d;
    case "WEEKLY":
      d.setUTCDate(d.getUTCDate() + 7 * count);
      return d;
    case "MONTHLY":
      return addMonths(d, count);
    case "YEARLY":
      return addMonths(d, 12 * count);
  }
}
