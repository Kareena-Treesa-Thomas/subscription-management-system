import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { transitionInput } from "@/lib/validation";
import { transitionSubscription } from "@/lib/subscription/service";

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole(req, "ADMIN", "STAFF");
  const { id } = await ctx.params;
  return transitionSubscription(id, transitionInput.parse(await req.json()).to);
});
