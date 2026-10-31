import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { cancelInvoice } from "@/lib/invoice/service";

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole(req, "ADMIN", "STAFF");
  return cancelInvoice((await ctx.params).id);
});
