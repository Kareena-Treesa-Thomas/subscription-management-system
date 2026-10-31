import type { BillingPeriod } from "@prisma/client";

const DAY = 86_400_000;
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);

function addMonths(d: Date, n: number) {
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + n, day = d.getUTCDate();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); // clamp 31 Jan -> 28/29 Feb
  return new Date(Date.UTC(y, m, Math.min(day, lastDay)));
}

/** Start of the period that follows a period starting at `start`. */
export function nextPeriodStart(start: Date, period: BillingPeriod): Date {
  switch (period) {
    case "DAILY": return addDays(start, 1);
    case "WEEKLY": return addDays(start, 7);
    case "MONTHLY": return addMonths(start, 1);
    case "YEARLY": return addMonths(start, 12);
  }
}

/** Inclusive end date of the period starting at `start`. */
export const periodEnd = (start: Date, period: BillingPeriod) => addDays(nextPeriodStart(start, period), -1);
