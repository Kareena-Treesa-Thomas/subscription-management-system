import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { simulateDateInput } from "@/lib/validation";
import { clearSimulatedDate, getSimulatedDate, getToday, setSimulatedDate } from "@/lib/clock";

const state = async () => ({ simulated: (await getSimulatedDate())?.toISOString().slice(0, 10) ?? null, today: (await getToday()).toISOString().slice(0, 10) });

export const GET = handle(async (req: Request) => { await requireRole(req, "ADMIN", "STAFF"); return state(); });

// body: { "date": "2026-12-01" }  or  { "date": null } to go back to real time. Admin only.
export const POST = handle(async (req: Request) => {
  await requireRole(req, "ADMIN");
  const { date } = simulateDateInput.parse(await req.json());
  if (date) await setSimulatedDate(date); else await clearSimulatedDate();
  return state();
});
