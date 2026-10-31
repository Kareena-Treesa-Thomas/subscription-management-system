"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { formDataToObject, type FormState } from "@/lib/form";
import { staffSchema } from "@/lib/validation";

export async function createStaffAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireRole("ADMIN"); // server-side guard: only admins can add staff

  const parsed = staffSchema.safeParse(formDataToObject(fd));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { name, email, password } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } }))
    return { fieldErrors: { email: ["An account with this email already exists"] } };

  await prisma.user.create({ data: { name, email, role: "STAFF", passwordHash: await bcrypt.hash(password, 10) } });
  revalidatePath("/staff");
  return { success: `${name} can now sign in as staff.` };
}
