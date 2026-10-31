// CONTRACT with Athira-Maria. She may replace the body, but keep the signature.
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type TaxResult = { ratePct: Prisma.Decimal; taxAmount: Prisma.Decimal };

/** Tax on a pre-tax `amount` using the Tax row `taxId` (null = untaxed). */
export async function calculateTax(amount: Prisma.Decimal.Value, taxId: string | null): Promise<TaxResult> {
  if (!taxId) return { ratePct: new Prisma.Decimal(0), taxAmount: new Prisma.Decimal(0) };
  const tax = await prisma.tax.findUnique({ where: { id: taxId } });
  if (!tax || !tax.active) return { ratePct: new Prisma.Decimal(0), taxAmount: new Prisma.Decimal(0) };
  const taxAmount = new Prisma.Decimal(amount).mul(tax.ratePct).div(100).toDecimalPlaces(2);
  return { ratePct: tax.ratePct, taxAmount };
}
