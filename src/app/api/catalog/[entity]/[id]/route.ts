import { NextRequest, NextResponse } from "next/server";
import { registry, isEntity } from "@/lib/catalog/registry";

type Ctx = { params: Promise<{ entity: string; id: string }> };
const notFound = () => NextResponse.json({ error: "Unknown catalog entity" }, { status: 404 });

export async function GET(req: NextRequest, ctx: Ctx) {
  const { entity } = await ctx.params;
  return isEntity(entity) ? registry[entity].getOne(req, ctx) : notFound();
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { entity } = await ctx.params;
  return isEntity(entity) ? registry[entity].update(req, ctx) : notFound();
}

// Soft delete: sets active=false
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { entity } = await ctx.params;
  return isEntity(entity) ? registry[entity].remove(req, ctx) : notFound();
}
