import { NextRequest, NextResponse } from "next/server";
import { tryRole } from "@/lib/auth";
import { getDashboard } from "@/lib/dashboard";
import { resolveRange } from "@/lib/dates";
import { dateOrUndefined, one, uuidOrUndefined } from "@/lib/filters";
import { getToday } from "@/lib/today";

export const dynamic = "force-dynamic";

// GET /api/dashboard?range=30d|90d|ytd|all  or  ?from=YYYY-MM-DD&to=YYYY-MM-DD   (+ &customerId=)
export async function GET(req: NextRequest) {
  if (!(await tryRole(["ADMIN", "STAFF"]))) {
    return NextResponse.json({ error: "You don't have access to this." }, { status: 403 });
  }
  const sp = Object.fromEntries(req.nextUrl.searchParams);
  const today = await getToday();
  const range = resolveRange({
    preset: one(sp.range),
    from: dateOrUndefined(one(sp.from)),
    to: dateOrUndefined(one(sp.to)),
    today,
  });
  const data = await getDashboard({ today, from: range.from, to: range.to, customerId: uuidOrUndefined(one(sp.customerId)) });
  return NextResponse.json({ today, range, ...data });
}
