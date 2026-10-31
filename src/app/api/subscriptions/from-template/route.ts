import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { fromTemplateInput } from "@/lib/validation";
import { createFromTemplate } from "@/lib/subscription/service";

export const POST = handle(async (req: Request) => {
  await requireRole(req, "ADMIN", "STAFF");
  return createFromTemplate(fromTemplateInput.parse(await req.json()));
});
