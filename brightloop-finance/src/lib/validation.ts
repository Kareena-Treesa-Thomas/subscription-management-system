import { z } from "zod";
import { PAYMENT_METHODS } from "./constants";

const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(v: string): boolean {
  if (!isoDateRe.test(v)) return false;
  const d = new Date(`${v}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** One schema, used by the form (client) and by POST /api/payments (server). */
export const paymentInputSchema = z.object({
  invoiceId: z.string({ required_error: "Choose an invoice" }).uuid("Choose an invoice"),
  method: z.enum(PAYMENT_METHODS, { errorMap: () => ({ message: "Choose a payment method" }) }),
  amount: z.coerce
    .number({ invalid_type_error: "Enter an amount" })
    .positive("Amount must be more than zero")
    .max(10_000_000, "Amount is too large")
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, "Use at most 2 decimal places"),
  paidOn: z.string({ required_error: "Enter the payment date" }).refine(isValidIsoDate, "Enter a valid date"),
  note: z
    .string()
    .trim()
    .max(300, "Keep the note under 300 characters")
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type PaymentInput = z.infer<typeof paymentInputSchema>;
