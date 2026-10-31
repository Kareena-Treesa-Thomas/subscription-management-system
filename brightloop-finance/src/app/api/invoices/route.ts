import { NextRequest, NextResponse } from "next/server";
import { tryRole } from "@/lib/auth";
import { parseInvoiceFilters } from "@/lib/filters";
import { listInvoices } from "@/lib/invoices";
import { lookupOpenInvoices } from "@/lib/lookups";
import { getToday } from "@/lib/today";

export const dynamic = "force-dynamic";

// GET /api/invoices?page=&q=&status=&customerId=&from=&to=
// GET /api/invoices?lookup=1&q=   -> open invoices for the payment form's picker
export async function GET(req: NextRequest) {
  if (!(await tryRole(["ADMIN", "STAFF"]))) {
    return NextResponse.json({ error: "You don't have access to this." }, { status: 403 });
  }
  const sp = Object.fromEntries(req.nextUrl.searchParams);
  if (sp.lookup) {
    return NextResponse.json({ items: await lookupOpenInvoices((sp.q ?? "").trim().slice(0, 80)) });
  }
  return NextResponse.json(await listInvoices(parseInvoiceFilters(sp), await getToday()));
}
