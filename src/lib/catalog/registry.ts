import { prisma } from "@/lib/prisma"; // shared Prisma singleton (create it if the base project has none)
import { crud } from "./crud";
import { productSchema, variantSchema, planSchema, taxSchema, discountSchema } from "@/lib/validation/catalog";

type D = Parameters<typeof crud>[0]["delegate"];

export const registry = {
  products: crud({
    delegate: prisma.product as unknown as D,
    schema: productSchema,
    filterFields: ["type"],
    include: { tax: { select: { id: true, name: true, ratePercent: true } } },
  }),
  variants: crud({
    delegate: prisma.productVariant as unknown as D,
    schema: variantSchema,
    searchField: "value",
    filterFields: ["productId"],
    include: { product: { select: { id: true, name: true } } },
  }),
  plans: crud({ delegate: prisma.plan as unknown as D, schema: planSchema, filterFields: ["billingPeriod"] }),
  taxes: crud({ delegate: prisma.tax as unknown as D, schema: taxSchema }),
  discounts: crud({
    delegate: prisma.discount as unknown as D,
    schema: discountSchema,
    filterFields: ["scope", "productId"],
    include: { product: { select: { id: true, name: true } } },
  }),
} as const;

export type CatalogEntity = keyof typeof registry;
export const isEntity = (s: string): s is CatalogEntity => s in registry;
