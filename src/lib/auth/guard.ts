// TEMPORARY SHIM. Anjanapriya replaces the body with the real Auth.js session lookup
// (keep the signature: requireRole(req, ...roles) -> { userId, role }).
import { HttpError } from "@/lib/http";

export type AppRole = "ADMIN" | "STAFF" | "CUSTOMER";
export type Actor = { userId: string; role: AppRole };

export async function requireRole(req: Request, ...roles: AppRole[]): Promise<Actor> {
  if (process.env.ALLOW_DEV_ROLE_HEADER === "true") {
    const role = req.headers.get("x-dev-role")?.toUpperCase() as AppRole | undefined;
    const userId = req.headers.get("x-dev-user") ?? "dev-user";
    if (role && (roles.length === 0 || roles.includes(role))) return { userId, role };
    if (role) throw new HttpError(403, "Forbidden");
  }
  throw new HttpError(401, "Not authenticated");
}
