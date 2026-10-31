// Stand-in for the auth module. Replace the body of requireRole() with the real helper
// (Anjanapriya's `requireRole()`) when merging; the call sites do not need to change.

export type Role = "ADMIN" | "STAFF" | "CUSTOMER";
export type Actor = { id: string | undefined; role: Role };

export class ForbiddenError extends Error {
  constructor() {
    super("You don't have access to this page.");
    this.name = "ForbiddenError";
  }
}

export async function requireRole(allowed: Role[]): Promise<Actor> {
  const role = (process.env.DEV_ROLE ?? "ADMIN").toUpperCase() as Role;
  if (!allowed.includes(role)) throw new ForbiddenError();
  return { id: undefined, role };
}

/** For API routes: returns null instead of throwing so the route can answer 403. */
export async function tryRole(allowed: Role[]): Promise<Actor | null> {
  try {
    return await requireRole(allowed);
  } catch (e) {
    if (e instanceof ForbiddenError) return null;
    throw e;
  }
}
