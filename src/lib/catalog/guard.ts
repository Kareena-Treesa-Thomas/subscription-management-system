// TEMPORARY STUBS. Until Anjanapriya shares requireRole() (~11:00) these endpoints are OPEN.
// When it lands, replace the bodies, e.g.:
//   import { requireRole } from "@/lib/auth/requireRole";
//   export const requireAdmin = () => requireRole(["ADMIN"]);
//   export const requireStaff = () => requireRole(["ADMIN", "STAFF"]);
// If requireRole throws a Response (401/403) or an error with a `status`, handle() in http.ts passes it through.

export async function requireAdmin(): Promise<void> {
  /* TODO swap for requireRole(["ADMIN"]) */
}

export async function requireStaff(): Promise<void> {
  /* TODO swap for requireRole(["ADMIN", "STAFF"]) */
}
