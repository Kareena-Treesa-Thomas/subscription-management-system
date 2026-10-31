import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { confirmInvoice } from "@/lib/invoice/service";

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole(req, "ADMIN", "STAFF");
  return confirmInvoice((await ctx.params).id);
});
