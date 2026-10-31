"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { addPeriod } from "@/lib/utils";

export type SubOp = "pause" | "resume" | "close" | "renew";

/** Customer self-service. Ownership is enforced in the query (customerId = signed-in user). */
export async function changeSubscription(id: string, op: SubOp): Promise<{ error?: string }> {
  const user = await requireRole("CUSTOMER");
  const sub = await prisma.subscription.findFirst({ where: { id, customerId: user.id }, include: { plan: true } });
  if (!sub) return { error: "Subscription not found." };
  const { plan } = sub;

  if (op === "pause") {
    if (!plan.pausable) return { error: "This plan can't be paused." };
    if (sub.status !== "ACTIVE") return { error: "Only active subscriptions can be paused." };
    await prisma.subscription.update({ where: { id }, data: { status: "PAUSED" } });
  } else if (op === "resume") {
    if (sub.status !== "PAUSED") return { error: "This subscription isn't paused." };
    await prisma.subscription.update({ where: { id }, data: { status: "ACTIVE" } });
  } else if (op === "close") {
    if (!plan.closableEarly) return { error: "This plan can't be closed early." };
    if (sub.status === "CLOSED") return { error: "Already closed." };
    await prisma.subscription.update({ where: { id }, data: { status: "CLOSED", expiryDate: new Date() } });
  } else if (op === "renew") {
    if (!plan.renewable) return { error: "This plan can't be renewed." };
    if (!["ACTIVE", "CLOSED"].includes(sub.status)) return { error: "Only active or closed subscriptions can be renewed." };
    const base = sub.expiryDate && sub.expiryDate > new Date() ? sub.expiryDate : new Date();
    await prisma.subscription.update({ where: { id }, data: { status: "ACTIVE", expiryDate: addPeriod(base, plan.billingPeriod) } });
  }

  revalidatePath("/portal");
  return {};
}
