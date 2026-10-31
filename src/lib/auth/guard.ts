import { auth } from "@/auth";
import { HttpError } from "@/lib/http";

export type AppRole = "ADMIN" | "STAFF" | "CUSTOMER";
export type Actor = { userId: string; role: AppRole };

export async function requireRole(_req: Request, ...roles: AppRole[]): Promise<Actor> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) throw new HttpError(401, "Not authenticated");
  if (roles.length && !roles.includes(user.role)) throw new HttpError(403, "Forbidden");
  return { userId: user.id, role: user.role };
}
