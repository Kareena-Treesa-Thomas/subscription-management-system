"use server";

import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { formDataToObject, type FormState } from "@/lib/form";
import { forgotSchema, loginSchema, resetSchema, signupSchema } from "@/lib/validation";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(formDataToObject(fd));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Email or password is incorrect." };
    throw e; // lets the redirect through
  }
  return {};
}

export async function signupAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(formDataToObject(fd));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { name, email, password } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } }))
    return { fieldErrors: { email: ["An account with this email already exists"] } };

  try {
    await prisma.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 10), role: "CUSTOMER" } });
  } catch {
    // unique-index race
    return { fieldErrors: { email: ["An account with this email already exists"] } };
  }
  await signIn("credentials", { email, password, redirectTo: "/portal" });
  return {};
}

export async function forgotPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = forgotSchema.safeParse({ email: str(fd, "email") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  let devLink: string | undefined;

  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: sha(token), expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
    });
    const link = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password/${token}`;
    const { sent } = await sendMail(user.email, "Reset your Brightloop password", `Hi ${user.name},\n\nReset your password (valid 30 minutes):\n${link}\n`);
    if (!sent) devLink = link; // no SMTP configured: show link on screen for the demo
  }
  // Same response whether or not the email exists (no account enumeration).
  return { success: "If that email has an account, a reset link is on its way.", devLink };
}

export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(formDataToObject(fd));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date())
    return { error: "This reset link is invalid or has expired. Request a new one." };

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 10) } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  redirect("/login?reset=1");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
