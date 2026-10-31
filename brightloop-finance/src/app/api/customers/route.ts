import { NextRequest, NextResponse } from "next/server";
import { tryRole } from "@/lib/auth";
import { lookupCustomers } from "@/lib/lookups";

export const dynamic = "force-dynamic";

// GET /api/customers?q=  -> up to 8 matches for the customer filter
export async function GET(req: NextRequest) {
  if (!(await tryRole(["ADMIN", "STAFF"]))) {
    return NextResponse.json({ error: "You don't have access to this." }, { status: 403 });
  }
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  return NextResponse.json({ items: await lookupCustomers(q) });
}
