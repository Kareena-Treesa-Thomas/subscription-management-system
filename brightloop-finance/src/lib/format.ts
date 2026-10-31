const inr2 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inr0 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** ₹1,23,456.00 */
export const money = (n: number): string => inr2.format(n);
/** ₹1,23,456 */
export const moneyShort = (n: number): string => inr0.format(Math.round(n));

export function formatDate(v: string | Date): string {
  const d = typeof v === "string" ? new Date(v.length === 10 ? `${v}T00:00:00.000Z` : v) : v;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(d);
}
