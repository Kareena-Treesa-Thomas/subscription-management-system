import type { NextAuthConfig } from "next-auth";
import { ADMIN_ONLY_PATHS, homeFor, type Role } from "@/lib/roles";

const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

// Edge-safe config (no Prisma / bcrypt) — used by middleware.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      const role = auth?.user?.role as Role | undefined;
      const go = (to: string) => Response.redirect(new URL(to, nextUrl));

      if (AUTH_PAGES.includes(path) || path.startsWith("/reset-password")) {
        return role ? go(homeFor(role)) : true;
      }
      if (!role) return false; // → /login
      if (path.startsWith("/portal")) return role === "CUSTOMER" ? true : go("/dashboard");
      if (role === "CUSTOMER" && path !== "/") return go("/portal"); // customers never see staff pages
      if (ADMIN_ONLY_PATHS.some((p) => path.startsWith(p)) && role !== "ADMIN") return go("/dashboard");
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
