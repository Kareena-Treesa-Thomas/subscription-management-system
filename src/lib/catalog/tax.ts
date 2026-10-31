import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export type TaxResult = { ratePct: Prisma.Decimal; taxAmount: Prisma.Decimal };

export type TaxableLine = {
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRatePercent: number;
};

export type TaxedLine = TaxableLine & { net: number; tax: number; amount: number };

export function calculateTax(amount: number, ratePercent: number): { net: number; tax: number; gross: number };
export function calculateTax(amount: Prisma.Decimal.Value, taxId: string | null): Promise<TaxResult>;
export function calculateTax(amount: number | Prisma.Decimal.Value, arg: number | string | null) {
  if (typeof arg === "number") {
    const net = round2(Number(amount));
    const tax = round2((net * arg) / 100);
    return { net, tax, gross: round2(net + tax) };
  }

  return (async (): Promise<TaxResult> => {
    if (!arg) return { ratePct: new Prisma.Decimal(0), taxAmount: new Prisma.Decimal(0) };
    const tax = await prisma.tax.findUnique({ where: { id: arg } });
    if (!tax || !tax.active) return { ratePct: new Prisma.Decimal(0), taxAmount: new Prisma.Decimal(0) };
    const taxAmount = new Prisma.Decimal(amount).mul(tax.ratePct).div(100).toDecimalPlaces(2);
    return { ratePct: tax.ratePct, taxAmount };
  })();
}

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
