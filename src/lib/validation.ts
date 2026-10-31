import { z } from "zod";

const qty = z.number().int().positive();

export const passwordRules = [
  { label: "At least 10 characters", test: (value: string) => value.length >= 10 },
  { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "One number", test: (value: string) => /\d/.test(value) },
  { label: "One special character", test: (value: string) => /[^A-Za-z0-9\s]/.test(value) },
];

const emailSchema = z.string().trim().email("Enter a valid email address").transform((email) => email.toLowerCase());
const passwordSchema = z.string().superRefine((value, ctx) => {
  for (const rule of passwordRules) {
    if (!rule.test(value)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: rule.label });
  }
});
const matchingPasswords = <T extends { password: string; confirmPassword: string }>(schema: z.ZodType<T>) =>
  schema.refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const signupSchema = matchingPasswords(z.object({
  name: z.string().trim().min(2, "Enter your name").max(100, "Name must be 100 characters or fewer"),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}));

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = matchingPasswords(z.object({
  token: z.string().min(1, "Reset token is missing"),
  password: passwordSchema,
  confirmPassword: z.string(),
}));

export const staffSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100, "Name must be 100 characters or fewer"),
  email: emailSchema,
  password: passwordSchema,
});

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
