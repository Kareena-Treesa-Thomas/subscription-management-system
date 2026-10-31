import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { sendInvoice } from "@/lib/invoice/service";

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole(req, "ADMIN", "STAFF");
  return sendInvoice((await ctx.params).id);
});
