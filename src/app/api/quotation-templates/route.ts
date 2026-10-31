import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { quotationTemplateInput } from "@/lib/validation";

export const GET = handle(async (req: Request) => {
  await requireRole(req, "ADMIN", "STAFF");
  return prisma.quotationTemplate.findMany({ include: { plan: true, lines: true }, orderBy: { name: "asc" } });
});

export const POST = handle(async (req: Request) => {
  await requireRole(req, "ADMIN", "STAFF");
  const { lines, ...rest } = quotationTemplateInput.parse(await req.json());
  return prisma.quotationTemplate.create({
    data: { ...rest, lines: { create: lines.map((l) => ({ productId: l.productId, variantId: l.variantId ?? null, quantity: l.quantity })) } },
    include: { lines: true },
  });
});
