import { z } from "zod";

const qty = z.number().int().positive();

export const subscriptionLineInput = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).nullish(),
  quantity: qty,
});

export const createSubscriptionInput = z.object({
  customerId: z.string().min(1),
  planId: z.string().min(1),
  startDate: z.coerce.date(),
  expiryDate: z.coerce.date().nullish(),
  paymentTermsDays: z.number().int().min(0).max(365).default(15),
  lines: z.array(subscriptionLineInput).min(1, "Add at least one line"),
}).refine((v) => !v.expiryDate || v.expiryDate > v.startDate, {
  path: ["expiryDate"], message: "Expiry must be after the start date",
});

export const fromTemplateInput = z.object({
  templateId: z.string().min(1),
  customerId: z.string().min(1),
  startDate: z.coerce.date(),
});

export const transitionInput = z.object({
  to: z.enum(["QUOTATION", "CONFIRMED", "ACTIVE", "CLOSED"]),
});

export const quotationTemplateInput = z.object({
  name: z.string().trim().min(2),
  planId: z.string().min(1),
  validityDays: z.number().int().min(1).max(365),
  lines: z.array(subscriptionLineInput).min(1),
});

export const simulateDateInput = z.object({ date: z.coerce.date().nullable() });
