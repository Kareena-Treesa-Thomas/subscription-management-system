import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

// GET /api/invoices?status=&page=&pageSize=   (customers only ever see their own)
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
    prisma.invoice.findMany({ where, orderBy: { issueDate: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { lines: true } }),
    prisma.invoice.count({ where }),
  ]);
  return { items, total, page, pageSize };
});
