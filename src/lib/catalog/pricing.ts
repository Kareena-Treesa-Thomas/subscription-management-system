import type { PrismaClient, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeUnitPrice } from "./plans";

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Unit price + tax rate for a product (and optional variant). Use when building subscription lines.
 * Example: product 1000 + variant "Brand: Odoo" (+560) -> unitPrice 1560.
 */
export async function getProductPricing(productId: string, variantId?: string | null, db: Db = prisma) {
  const product = await db.product.findUnique({ where: { id: productId }, include: { tax: true } });
  if (!product) throw new Error("Product not found");

  let extra = 0;
  let variantLabel: string | null = null;
  if (variantId) {
    const v = await db.productVariant.findUnique({ where: { id: variantId } });
    if (!v || v.productId !== productId) throw new Error("Variant not valid for this product");
    extra = Number(v.extraPrice);
    variantLabel = `${v.attribute}: ${v.value}`;
  }
  const taxActive = product.tax?.active ?? false;
  return {
    productId: product.id,
    name: product.name,
    variantLabel,
    unitPrice: computeUnitPrice(Number(product.salesPrice), extra),
    taxName: taxActive ? product.tax!.name : null,
    taxRatePercent: taxActive ? Number(product.tax!.ratePct) : 0,
  };
}
