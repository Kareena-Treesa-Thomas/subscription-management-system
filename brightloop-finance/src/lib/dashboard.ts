import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { AGING_BUCKETS, type AgingKey } from "./constants";
import { lastMonthKeys, monthLabel } from "./dates";

const { sql, empty } = Prisma;

export type DashboardFilters = { today: string; from?: string; to?: string; customerId?: string };

/**
 * Every number on the finance dashboard comes from one SQL aggregate (COUNT / SUM),
 * run in parallel. Nothing is loaded into JS and summed there.
 * Money is returned as float8 for display only; stored amounts stay NUMERIC(12,2).
 */
export async function getDashboard(f: DashboardFilters) {
  const { today, from, to, customerId } = f;

  const custInv = customerId ? sql`AND i.customer_id = ${customerId}::uuid` : empty;
  const custSub = customerId ? sql`AND s.customer_id = ${customerId}::uuid` : empty;
  const fromSql = from ? sql`AND p.paid_on >= ${from}::date` : empty;
  const toSql = to ? sql`AND p.paid_on <= ${to}::date` : empty;

  const monthKeys = lastMonthKeys(today, 12);
  const monthsStart = `${monthKeys[0]}-01`;

  const [activeRows, revenueRows, openRows, mrrRows, agingRows, billedRows, collectedRows, methodRows, topRows] =
    await Promise.all([
      prisma.$queryRaw<{ n: number }[]>`
        SELECT COUNT(*)::int AS n
        FROM subscriptions s
        WHERE s.status = 'ACTIVE' ${custSub}`,

      prisma.$queryRaw<{ total: number; n: number }[]>`
        SELECT COALESCE(SUM(p.amount), 0)::float8 AS total, COUNT(*)::int AS n
        FROM payments p
        JOIN invoices i ON i.id = p.invoice_id
        WHERE 1 = 1 ${fromSql} ${toSql} ${custInv}`,

      prisma.$queryRaw<{ owed: number; open_count: number; overdue_amount: number; overdue_count: number }[]>`
        SELECT
          COALESCE(SUM(i.total - i.amount_paid), 0)::float8 AS owed,
          COUNT(*)::int AS open_count,
          COALESCE(SUM(CASE WHEN i.due_date < ${today}::date THEN i.total - i.amount_paid ELSE 0 END), 0)::float8 AS overdue_amount,
          (COUNT(*) FILTER (WHERE i.due_date < ${today}::date))::int AS overdue_count
        FROM invoices i
        WHERE i.status = 'CONFIRMED' ${custInv}`,

      prisma.$queryRaw<{ mrr: number }[]>`
        SELECT COALESCE(SUM(
          CASE pl.billing_period
            WHEN 'DAILY'   THEN s.recurring_amount * 30
            WHEN 'WEEKLY'  THEN s.recurring_amount * 52 / 12
            WHEN 'MONTHLY' THEN s.recurring_amount
            WHEN 'YEARLY'  THEN s.recurring_amount / 12
          END), 0)::float8 AS mrr
        FROM subscriptions s
        JOIN plans pl ON pl.id = s.plan_id
        WHERE s.status = 'ACTIVE' ${custSub}`,

      prisma.$queryRaw<{ bucket: AgingKey; n: number; amount: number }[]>`
        SELECT bucket, COUNT(*)::int AS n, COALESCE(SUM(owed), 0)::float8 AS amount
        FROM (
          SELECT
            (i.total - i.amount_paid) AS owed,
            CASE
              WHEN i.due_date >= ${today}::date THEN 'current'
              WHEN ${today}::date - i.due_date <= 30 THEN 'd1_30'
              WHEN ${today}::date - i.due_date <= 60 THEN 'd31_60'
              WHEN ${today}::date - i.due_date <= 90 THEN 'd61_90'
              ELSE 'd90_plus'
            END AS bucket
          FROM invoices i
          WHERE i.status = 'CONFIRMED' ${custInv}
        ) t
        GROUP BY bucket`,

      prisma.$queryRaw<{ month: string; amount: number }[]>`
        SELECT to_char(date_trunc('month', i.issue_date), 'YYYY-MM') AS month,
               COALESCE(SUM(i.total), 0)::float8 AS amount
        FROM invoices i
        WHERE i.status IN ('CONFIRMED', 'PAID')
          AND i.issue_date >= ${monthsStart}::date AND i.issue_date <= ${today}::date ${custInv}
        GROUP BY 1`,

      prisma.$queryRaw<{ month: string; amount: number }[]>`
        SELECT to_char(date_trunc('month', p.paid_on), 'YYYY-MM') AS month,
               COALESCE(SUM(p.amount), 0)::float8 AS amount
        FROM payments p
        JOIN invoices i ON i.id = p.invoice_id
        WHERE p.paid_on >= ${monthsStart}::date AND p.paid_on <= ${today}::date ${custInv}
        GROUP BY 1`,

      prisma.$queryRaw<{ method: string; amount: number; n: number }[]>`
        SELECT p.method::text AS method, COALESCE(SUM(p.amount), 0)::float8 AS amount, COUNT(*)::int AS n
        FROM payments p
        JOIN invoices i ON i.id = p.invoice_id
        WHERE 1 = 1 ${fromSql} ${toSql} ${custInv}
        GROUP BY p.method
        ORDER BY amount DESC`,

      prisma.$queryRaw<{ id: string; name: string; n: number; owed: number; days: number }[]>`
        SELECT u.id, u.name, COUNT(*)::int AS n,
               SUM(i.total - i.amount_paid)::float8 AS owed,
               MAX(${today}::date - i.due_date)::int AS days
        FROM invoices i
        JOIN users u ON u.id = i.customer_id
        WHERE i.status = 'CONFIRMED' AND i.due_date < ${today}::date ${custInv}
        GROUP BY u.id, u.name
        ORDER BY owed DESC
        LIMIT 5`,
    ]);

  const mrr = mrrRows[0]?.mrr ?? 0;
  const agingMap = new Map(agingRows.map((r) => [r.bucket, r]));
  const billedMap = new Map(billedRows.map((r) => [r.month, r.amount]));
  const collectedMap = new Map(collectedRows.map((r) => [r.month, r.amount]));

  return {
    activeSubscriptions: activeRows[0]?.n ?? 0,
    revenue: { total: revenueRows[0]?.total ?? 0, count: revenueRows[0]?.n ?? 0 },
    owed: { amount: openRows[0]?.owed ?? 0, count: openRows[0]?.open_count ?? 0 },
    overdue: { amount: openRows[0]?.overdue_amount ?? 0, count: openRows[0]?.overdue_count ?? 0 },
    mrr,
    arr: mrr * 12,
    aging: AGING_BUCKETS.map((b) => ({
      key: b.key,
      label: b.label,
      color: b.color,
      count: agingMap.get(b.key)?.n ?? 0,
      amount: agingMap.get(b.key)?.amount ?? 0,
    })),
    months: monthKeys.map((k) => ({
      month: k,
      label: monthLabel(k),
      billed: billedMap.get(k) ?? 0,
      collected: collectedMap.get(k) ?? 0,
    })),
    byMethod: methodRows,
    topOverdue: topRows,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
