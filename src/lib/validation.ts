import { z } from "zod";

// Shared by client forms and server actions.
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

export const signupSchema = z
  .object({ name: nameSchema, email: emailSchema, password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password") });
export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({ token: z.string().min(10), password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const staffSchema = z.object({ name: nameSchema, email: emailSchema, password: passwordSchema });
