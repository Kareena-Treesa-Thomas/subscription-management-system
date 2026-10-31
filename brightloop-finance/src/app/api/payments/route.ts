import { NextRequest, NextResponse } from "next/server";
import { tryRole } from "@/lib/auth";
import { parsePaymentFilters } from "@/lib/filters";
import { listPayments, PaymentError, recordPayment } from "@/lib/payments";
import { paymentInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const forbidden = () => NextResponse.json({ error: "You don't have access to this." }, { status: 403 });

// GET /api/payments?page=&q=&method=&customerId=&from=&to=
export async function GET(req: NextRequest) {
  if (!(await tryRole(["ADMIN", "STAFF"]))) return forbidden();
  const sp = Object.fromEntries(req.nextUrl.searchParams);
  return NextResponse.json(await listPayments(parsePaymentFilters(sp)));
}

// POST /api/payments  { invoiceId, method, amount, paidOn, note? }
export async function POST(req: NextRequest) {
  const actor = await tryRole(["ADMIN", "STAFF"]);
  if (!actor) return forbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send the payment as a JSON body." }, { status: 400 });
  }

  const parsed = paymentInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const result = await recordPayment(parsed.data, actor.id);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof PaymentError) {
      return NextResponse.json(
        { error: e.message, code: e.code, fieldErrors: e.field ? { [e.field]: [e.message] } : undefined },
        { status: e.status },
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Something went wrong on our side. Try again." }, { status: 500 });
  }
}
