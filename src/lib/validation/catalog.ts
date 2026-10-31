// Shared Zod schemas: used by the API routes (server) AND the forms (client).
import { z } from "zod";

const money = z.coerce.number().min(0, "Must be 0 or more").max(99999999.99, "Too large");
const positiveMoney = z.coerce.number().gt(0, "Must be greater than 0").max(99999999.99, "Too large");
const optionalMoney = z.coerce.number().min(0, "Must be 0 or more").nullable().optional();
const optionalInt = z.coerce.number().int("Whole number only").min(1, "Must be at least 1").nullable().optional();
const optionalDate = z.coerce.date().nullable().optional();
const name = z.string().trim().min(2, "At least 2 characters").max(120, "At most 120 characters");
const optionalId = z.string().min(1).nullable().optional();

export const productSchema = z.object({
  name,
  type: z.enum(["SOFTWARE", "ADDON", "SERVICE", "PHYSICAL"]),
  salesPrice: money,
  costPrice: money.default(0),
  notes: z.string().trim().max(1000, "At most 1000 characters").nullable().optional(),
  taxId: optionalId,
  active: z.boolean().default(true),
});

export const variantSchema = z.object({
  productId: z.string().min(1, "Choose a product"),
  attribute: z.string().trim().min(1, "Required").max(60), // e.g. Brand
  value: z.string().trim().min(1, "Required").max(60), // e.g. Odoo
  extraPrice: z.coerce.number().min(-99999999.99).max(99999999.99).default(0),
  active: z.boolean().default(true),
});

export const taxSchema = z.object({
  name,
  ratePercent: z.coerce.number().min(0, "Must be 0 or more").max(100, "Cannot exceed 100%"),
  active: z.boolean().default(true),
});

export const planSchema = z
  .object({
    name,
    price: money,
    billingPeriod: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
    minQuantity: z.coerce.number().int("Whole number only").min(1, "Must be at least 1").default(1),
    availableFrom: optionalDate,
    availableTo: optionalDate,
    autoCloseAtEnd: z.boolean().default(false),
    closableEarly: z.boolean().default(true),
    pausable: z.boolean().default(false),
    renewable: z.boolean().default(true),
    active: z.boolean().default(true),
  })
  .refine((p) => !p.availableFrom || !p.availableTo || p.availableTo >= p.availableFrom, {
    message: "End date must be on or after the start date",
    path: ["availableTo"],
  });

export const discountSchema = z
  .object({
    name,
    type: z.enum(["FIXED", "PERCENTAGE"]),
    value: positiveMoney,
    scope: z.enum(["PRODUCT", "SUBSCRIPTION"]),
    productId: optionalId,
    minPurchaseAmount: optionalMoney,
    minQuantity: optionalInt,
    startDate: z.coerce.date(),
    endDate: optionalDate,
    usageLimit: optionalInt,
    active: z.boolean().default(true),
  })
  .refine((d) => d.type !== "PERCENTAGE" || d.value <= 100, {
    message: "Percentage cannot exceed 100",
    path: ["value"],
  })
  .refine((d) => d.scope !== "PRODUCT" || !!d.productId, {
    message: "Choose a product for product-scoped discounts",
    path: ["productId"],
  })
  .refine((d) => !d.endDate || d.endDate >= d.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });
