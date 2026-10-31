import { NextRequest, NextResponse } from "next/server";
import { registry, isEntity } from "@/lib/catalog/registry";

type Ctx = { params: Promise<{ entity: string }> };
const notFound = () => NextResponse.json({ error: "Unknown catalog entity" }, { status: 404 });

// GET /api/catalog/{products|variants|plans|taxes|discounts}?page=1&pageSize=10&q=&active=true
export async function GET(req: NextRequest, { params }: Ctx) {
  const { entity } = await params;
  return isEntity(entity) ? registry[entity].list(req) : notFound();
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { entity } = await params;
  return isEntity(entity) ? registry[entity].create(req) : notFound();
}
