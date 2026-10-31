import { Prisma } from "@prisma/client";
import { prisma, type Tx } from "@/lib/prisma";
import { HttpError } from "@/lib/http";
import { getToday, startOfDayUTC } from "@/lib/clock";
import { nextNumber } from "@/lib/sequence";
import { addDays } from "@/lib/billing/period";
import { canTransition } from "./status";
import type { z } from "zod";
import type { createSubscriptionInput, fromTemplateInput } from "@/lib/validation";

type CreateInput = z.infer<typeof createSubscriptionInput>;

/** Resolve lines to priced rows: plan price is the base, variant adds extraPrice. */
async function priceLines(tx: Tx, planId: string, lines: CreateInput["lines"]) {
  const plan = await tx.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new HttpError(404, "Plan not found");
  const out = [];
  for (const l of lines) {
    if (l.quantity < plan.minQuantity) {
      throw new HttpError(400, `Minimum quantity for plan "${plan.name}" is ${plan.minQuantity}`);
    }
    const product = await tx.product.findUnique({ where: { id: l.productId }, include: { variants: true } });
    if (!product) throw new HttpError(404, `Product ${l.productId} not found`);
    const variant = l.variantId ? product.variants.find((v) => v.id === l.variantId) : undefined;
    if (l.variantId && !variant) throw new HttpError(400, "Variant does not belong to product");
    const unitPrice = new Prisma.Decimal(product.salesPrice).add(variant?.extraPrice ?? 0);
    out.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      description: variant ? `${product.name} (${variant.attribute}: ${variant.value})` : product.name,
      quantity: l.quantity,
      unitPrice,
      taxId: product.taxId,
      amount: unitPrice.mul(l.quantity).toDecimalPlaces(2),
    });
  }
  return { plan, lines: out };
}

export async function createSubscription(input: CreateInput, extra: { quotationValidUntil?: Date } = {}) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.user.findUnique({ where: { id: input.customerId } });
    if (!customer) throw new HttpError(404, "Customer not found");
    const { plan, lines } = await priceLines(tx, input.planId, input.lines);
    const start = startOfDayUTC(input.startDate);
    if (plan.availableFrom && start < plan.availableFrom) throw new HttpError(400, "Plan not yet available on that start date");
    if (plan.availableTo && start > plan.availableTo) throw new HttpError(400, "Plan no longer available on that start date");
    return tx.subscription.create({
      data: {
        number: await nextNumber(tx, "SUB"),
        customerId: input.customerId,
        planId: plan.id,
        startDate: start,
        expiryDate: input.expiryDate ? startOfDayUTC(input.expiryDate) : null,
        paymentTermsDays: input.paymentTermsDays,
        paymentTerms: input.paymentTermsDays === 0 ? "Due on receipt" : `Net ${input.paymentTermsDays}`,
        quotationValidUntil: extra.quotationValidUntil,
        lines: { create: lines },
      },
      include: { lines: true },
    });
  });
}

export async function createFromTemplate(input: z.infer<typeof fromTemplateInput>) {
  const tpl = await prisma.quotationTemplate.findUnique({ where: { id: input.templateId }, include: { lines: true } });
  if (!tpl) throw new HttpError(404, "Template not found");
  const today = await getToday();
  return createSubscription(
    {
      customerId: input.customerId,
      planId: tpl.planId,
      startDate: input.startDate,
      paymentTermsDays: 15,
      lines: tpl.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
    },
    { quotationValidUntil: addDays(today, tpl.validityDays) },
  );
}

export async function transitionSubscription(id: string, to: "QUOTATION" | "CONFIRMED" | "ACTIVE" | "CLOSED") {
  return prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.findUnique({ where: { id }, include: { plan: true } });
    if (!sub) throw new HttpError(404, "Subscription not found");
    if (!canTransition(sub.status, to)) throw new HttpError(409, `Cannot move from ${sub.status} to ${to}`);
    const today = await getToday();

    if (to === "CONFIRMED" && sub.quotationValidUntil && today > sub.quotationValidUntil) {
      throw new HttpError(409, "Quotation has expired");
    }
    if (to === "CLOSED" && sub.status === "ACTIVE" && !sub.plan.closableEarly) {
      const ended = sub.expiryDate && today >= sub.expiryDate;
      if (!ended) throw new HttpError(409, "This plan cannot be closed early");
    }
    return tx.subscription.update({
      where: { id },
      data: {
        status: to,
        // billing starts at the start date; first invoice is issued in advance
        nextInvoiceDate: to === "ACTIVE" ? sub.startDate : to === "CLOSED" ? null : undefined,
      },
    });
  });
}
