import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

/** Wraps a route handler: turns validation / DB errors into clean JSON responses. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Response) return e; // e.g. a 403 thrown by requireRole
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: e.flatten().fieldErrors },
        { status: 400 },
      );
    }
    if (e instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") return NextResponse.json({ error: "That record already exists" }, { status: 409 });
      if (e.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (e.code === "P2003") return NextResponse.json({ error: "Related record does not exist" }, { status: 400 });
    }
    const status = (e as { status?: number })?.status;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: status === 401 ? "Not signed in" : "Not allowed" }, { status });
    }
    console.error("[catalog api]", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
