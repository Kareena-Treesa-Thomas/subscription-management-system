import { NextResponse } from "next/server";
import { auth } from "@/auth";

// API-safe role check: throws a JSON 401/403 Response (handle() in http.ts returns it).
// requireRole() in rbac.ts redirects to a page, which is wrong for API routes.
async function check(allowed: string[]) {
  const session = await auth();
  if (!session?.user) throw NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!allowed.includes(session.user.role)) {
    throw NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
}

export const requireAdmin = () => check(["ADMIN"]);
export const requireStaff = () => check(["ADMIN", "STAFF"]);