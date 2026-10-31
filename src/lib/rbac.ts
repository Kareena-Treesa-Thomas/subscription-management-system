import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { homeFor, type Role } from "@/lib/roles";

/**
 * Use at the top of any server component or server action:
 *   const user = await requireRole("ADMIN");
 *   const user = await requireRole("ADMIN", "STAFF");
 * Not signed in → /login. Wrong role → that role's home page.
 */
export async function requireRole(...allowed: Role[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (allowed.length && !allowed.includes(session.user.role)) redirect(homeFor(session.user.role));
  return session.user;
}

export const requireUser = () => requireRole();
