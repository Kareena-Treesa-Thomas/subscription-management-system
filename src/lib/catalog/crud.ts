import { NextRequest, NextResponse } from "next/server";
import type { ZodTypeAny } from "zod";
import { handle } from "./http";
import { requireAdmin, requireStaff } from "./guard";

// Loose delegate type so one factory can serve every Prisma model.
type Delegate = {
  findMany(args: unknown): Promise<unknown[]>;
  count(args: unknown): Promise<number>;
  findUnique(args: unknown): Promise<unknown>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
};

type Options = {
  delegate: Delegate;
  schema: ZodTypeAny;
  searchField?: string;
  filterFields?: string[];
  include?: Record<string, unknown>;
  orderBy?: Record<string, unknown>;
};

type Ctx = { params: Promise<{ id?: string }> };

/** Builds list / create / get / update / deactivate handlers.
 *  Reads: admin + staff. Writes: admin only. Deletes are SOFT (active=false) because invoices reference these rows. */
export function crud({ delegate, schema, searchField = "name", filterFields = [], include, orderBy = { createdAt: "desc" } }: Options) {
  const list = (req: NextRequest) =>
    handle(async () => {
      await requireStaff();
      const sp = req.nextUrl.searchParams;
      const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "10", 10) || 10));
      const where: Record<string, unknown> = {};
      const q = sp.get("q")?.trim();
      if (q) where[searchField] = { contains: q, mode: "insensitive" };
      if (sp.get("active") === "true") where.active = true;
      for (const f of filterFields) {
        const v = sp.get(f);
        if (v) where[f] = v;
      }
      const [items, total] = await Promise.all([
        delegate.findMany({ where, include, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
        delegate.count({ where }),
      ]);
      return NextResponse.json({ items, total, page, pageSize });
    });

  const create = (req: NextRequest) =>
    handle(async () => {
      await requireAdmin();
      const data = schema.parse(await req.json());
      const row = await delegate.create({ data, include });
      return NextResponse.json(row, { status: 201 });
    });

  const getOne = (_req: NextRequest, ctx: Ctx) =>
    handle(async () => {
      await requireStaff();
      const { id } = await ctx.params;
      const row = await delegate.findUnique({ where: { id }, include });
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(row);
    });

  const update = (req: NextRequest, ctx: Ctx) =>
    handle(async () => {
      await requireAdmin();
      const { id } = await ctx.params;
      const data = schema.parse(await req.json()); // full object, same rules as create
      const row = await delegate.update({ where: { id }, data, include });
      return NextResponse.json(row);
    });

  const remove = (_req: NextRequest, ctx: Ctx) =>
    handle(async () => {
      await requireAdmin();
      const { id } = await ctx.params;
      const row = await delegate.update({ where: { id }, data: { active: false }, include });
      return NextResponse.json(row);
    });

  return { list, create, getOne, update, remove };
}
