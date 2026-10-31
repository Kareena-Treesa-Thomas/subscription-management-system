import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { recordPayment } from "@/lib/invoice/service";
import { paymentInput } from "@/lib/validation";

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const actor = await requireRole(req, "ADMIN", "STAFF", "CUSTOMER");
  const input = paymentInput.parse(await req.json());
  return recordPayment((await ctx.params).id, input, actor);
});
