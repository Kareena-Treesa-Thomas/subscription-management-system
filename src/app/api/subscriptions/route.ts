import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { createSubscriptionInput } from "@/lib/validation";
import { createSubscription } from "@/lib/subscription/service";

// GET /api/subscriptions?status=ACTIVE&page=1&pageSize=20
export const GET = handle(async (req: Request) => {
  const actor = await requireRole(req, "ADMIN", "STAFF", "CUSTOMER");
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));
  const status = url.searchParams.get("status") ?? undefined;
  const where = {
    ...(status ? { status: status as never } : {}),
    ...(actor.role === "CUSTOMER" ? { customerId: actor.userId } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.subscription.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
      include: { customer: { select: { name: true, email: true } }, plan: { select: { name: true, billingPeriod: true } } },
    }),
    prisma.subscription.count({ where }),
  ]);
  return { items, total, page, pageSize };
});

export const POST = handle(async (req: Request) => {
  await requireRole(req, "ADMIN", "STAFF");
  return createSubscription(createSubscriptionInput.parse(await req.json()));
});
