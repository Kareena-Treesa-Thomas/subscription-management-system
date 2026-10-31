// Pure functions (no DB) so they are easy to test and reuse in invoices.

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/** Tax on a single amount. calculateTax(1000, 18) -> { net: 1000, tax: 180, gross: 1180 } */
export function calculateTax(amount: number, ratePercent: number) {
  const net = round2(amount);
  const tax = round2((net * ratePercent) / 100);
  return { net, tax, gross: round2(net + tax) };
}

export type TaxableLine = {
  quantity: number;
  unitPrice: number;
  /** discount amount already allocated to this line (reduces the taxable amount) */
  discount?: number;
  taxRatePercent: number;
};

export type TaxedLine = TaxableLine & { net: number; tax: number; amount: number };

/** Tax for many lines. Tax is charged on (qty * unitPrice - discount). */
export function calculateLinesTax(lines: TaxableLine[]) {
  const taxed: TaxedLine[] = lines.map((l) => {
    const base = Math.max(0, l.quantity * l.unitPrice - (l.discount ?? 0));
    const { net, tax, gross } = calculateTax(base, l.taxRatePercent);
    return { ...l, net, tax, amount: gross };
  });
  const subtotal = round2(taxed.reduce((s, l) => s + l.net, 0));
  const taxTotal = round2(taxed.reduce((s, l) => s + l.tax, 0));
  return { lines: taxed, subtotal, taxTotal, total: round2(subtotal + taxTotal) };
}
