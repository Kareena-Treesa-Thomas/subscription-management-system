import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { runBilling } from "@/lib/billing/engine";

export const POST = handle(async (req: Request) => {
  await requireRole(req, "ADMIN", "STAFF");
  return runBilling();
});
