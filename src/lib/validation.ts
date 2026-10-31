import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(9, "Use more than 8 characters")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[^A-Za-z0-9]/, "Add a special character (e.g. @ # $ !)");

export const passwordRules = [
  { label: "More than 8 characters", test: (p: string) => p.length > 8 },
  { label: "An uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "A lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "A special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");
const nameSchema = z.string().trim().min(2, "Enter your full name").max(80, "Name is too long");

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((v) => v.password === v.confirmPassword, {
  path: ["confirmPassword"], message: "Passwords do not match",
});

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password") });
export const forgotSchema = z.object({ email: emailSchema });
export const resetSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((v) => v.password === v.confirmPassword, {
  path: ["confirmPassword"], message: "Passwords do not match",
});
export const staffSchema = z.object({ name: nameSchema, email: emailSchema, password: passwordSchema });

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

export const paymentInput = z.object({
  method: z.string().trim().min(1).max(40),
  amount: z.coerce.number().positive(),
  paidOn: z.coerce.date().optional(),
  note: z.string().trim().max(500).optional(),
});
