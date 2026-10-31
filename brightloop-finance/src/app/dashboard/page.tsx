import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { AsyncPicker } from "@/components/AsyncPicker";
import { RevenueChart } from "@/components/RevenueChart";
import { requireRole } from "@/lib/auth";
import { METHOD_LABELS, type PaymentMethodValue } from "@/lib/constants";
import { getDashboard } from "@/lib/dashboard";
import { resolveRange } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { buildQuery, dateOrUndefined, one, uuidOrUndefined, type SP } from "@/lib/filters";
import { formatDate, money, moneyShort } from "@/lib/format";
import { getTodayInfo } from "@/lib/today";

export const dynamic = "force-dynamic";

const PRESETS = [
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "ytd", label: "This year" },
  { key: "all", label: "All time" },
];

function Stat({ label, value, note, href }: { label: string; value: string; note: string; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-ink-soft">{note}</p>
    </>
  );
  return href ? (
    <Link href={href} className="block px-5 py-4 hover:bg-canvas">
      {body}
    </Link>
  ) : (
    <div className="px-5 py-4">{body}</div>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: SP }) {
  await requireRole(["ADMIN", "STAFF"]);
  const { date: today } = await getTodayInfo();

  const customerId = uuidOrUndefined(one(searchParams.customerId));
  const range = resolveRange({
    preset: one(searchParams.range),
    from: dateOrUndefined(one(searchParams.from)),
    to: dateOrUndefined(one(searchParams.to)),
    today,
  });
  const customer = customerId
    ? await prisma.user.findUnique({ where: { id: customerId }, select: { id: true, name: true, email: true } })
    : null;

  const t0 = performance.now();
  const d = await getDashboard({ today, from: range.from, to: range.to, customerId: customer ? customer.id : undefined });
  const ms = Math.round(performance.now() - t0);

  const agingTotal = d.aging.reduce((s, b) => s + b.amount, 0);
  const cust = customer ? customer.id : undefined;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Finance dashboard"
        subtitle={customer ? `Showing ${customer.name} only.` : "Subscriptions, revenue and what is still owed across all customers."}
      />

      <section aria-label="Filters" className="panel mb-6 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <Link
              key={p.key}
              href={`/dashboard${buildQuery({ range: p.key, customerId: cust })}`}
              aria-current={range.preset === p.key ? "true" : undefined}
              className={`rounded-full px-3 py-1.5 text-sm ${
                range.preset === p.key ? "bg-ink text-white" : "border border-line hover:bg-canvas"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <form method="get" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_9rem_9rem_auto] lg:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium">Customer</label>
            <AsyncPicker
              endpoint="/api/customers"
              name="customerId"
              placeholder="All customers"
              initial={customer ? { id: customer.id, label: customer.name, sub: customer.email } : null}
            />
          </div>
          <div>
            <label htmlFor="from" className="mb-1 block text-sm font-medium">
              From
            </label>
            <input id="from" name="from" type="date" defaultValue={range.preset === "custom" ? range.from : ""} className="field" />
          </div>
          <div>
            <label htmlFor="to" className="mb-1 block text-sm font-medium">
              To
            </label>
            <input id="to" name="to" type="date" defaultValue={range.preset === "custom" ? range.to : ""} className="field" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              Apply
            </button>
            <Link href="/dashboard" className="btn-quiet">
              Reset
            </Link>
          </div>
        </form>
      </section>

      <section aria-label="Key numbers" className="panel mb-6 grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x">
        <Stat label="Active subscriptions" value={d.activeSubscriptions.toLocaleString("en-IN")} note="Right now" />
        <Stat
          label="Revenue collected"
          value={moneyShort(d.revenue.total)}
          note={`${d.revenue.count.toLocaleString("en-IN")} payments · ${range.label.toLowerCase()}`}
          href={`/payments${buildQuery({ from: range.from, to: range.to, customerId: cust })}`}
        />
        <Stat
          label="Still owed"
          value={moneyShort(d.owed.amount)}
          note={`${d.owed.count.toLocaleString("en-IN")} unpaid invoices`}
          href={`/invoices${buildQuery({ status: "unpaid", customerId: cust })}`}
        />
        <Stat
          label="Overdue"
          value={moneyShort(d.overdue.amount)}
          note={`${d.overdue.count.toLocaleString("en-IN")} invoices past due`}
          href={`/invoices${buildQuery({ status: "overdue", customerId: cust })}`}
        />
        <Stat label="Monthly recurring revenue" value={moneyShort(d.mrr)} note={`${moneyShort(d.arr)} a year (ARR)`} />
      </section>

      <section aria-labelledby="aging-title" className="panel mb-6 p-5">
        <h2 id="aging-title" className="text-lg font-semibold">
          Where the unpaid money is sitting
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Open invoices grouped by how long they have been past their due date, as of {formatDate(today)}.
        </p>

        {agingTotal > 0 ? (
          <>
            <div className="mt-5 flex h-4 w-full overflow-hidden rounded-full bg-canvas" role="img" aria-label="Unpaid amount by age">
              {d.aging
                .filter((b) => b.amount > 0)
                .map((b) => (
                  <div
                    key={b.key}
                    title={`${b.label}: ${money(b.amount)}`}
                    style={{ width: `${(b.amount / agingTotal) * 100}%`, backgroundColor: b.color }}
                  />
                ))}
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem]">
                <thead>
                  <tr className="border-b border-line">
                    <th className="th">Age</th>
                    <th className="th text-right">Invoices</th>
                    <th className="th text-right">Amount</th>
                    <th className="th text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {d.aging.map((b) => (
                    <tr key={b.key}>
                      <td className="td">
                        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ backgroundColor: b.color }} />
                        {b.label}
                      </td>
                      <td className="td text-right tabular-nums">{b.count.toLocaleString("en-IN")}</td>
                      <td className="td text-right tabular-nums">{money(b.amount)}</td>
                      <td className="td text-right tabular-nums">{Math.round((b.amount / agingTotal) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="mt-5 text-sm text-ink-soft">Nothing is owed right now. Every confirmed invoice is paid.</p>
        )}
      </section>

      <section aria-labelledby="chart-title" className="panel mb-6 p-5">
        <h2 id="chart-title" className="text-lg font-semibold">
          Billed and collected, last 12 months
        </h2>
        <p className="mb-4 mt-1 text-sm text-ink-soft">Billed is by invoice date. Collected is by the date the payment arrived.</p>
        <RevenueChart data={d.months} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="overdue-title" className="panel overflow-hidden">
          <div className="p-5 pb-3">
            <h2 id="overdue-title" className="text-lg font-semibold">
              Customers to chase first
            </h2>
            <p className="mt-1 text-sm text-ink-soft">Largest overdue balances.</p>
          </div>
          {d.topOverdue.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-ink-soft">No overdue invoices.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-y border-line">
                    <th className="th">Customer</th>
                    <th className="th text-right">Invoices</th>
                    <th className="th text-right">Oldest</th>
                    <th className="th text-right">Owed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {d.topOverdue.map((c) => (
                    <tr key={c.id}>
                      <td className="td">
                        <Link
                          href={`/invoices${buildQuery({ status: "overdue", customerId: c.id })}`}
                          className="font-medium text-brand-dark hover:underline"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="td text-right tabular-nums">{c.n}</td>
                      <td className="td text-right tabular-nums">{c.days} days</td>
                      <td className="td text-right font-medium tabular-nums">{money(c.owed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="method-title" className="panel p-5">
          <h2 id="method-title" className="text-lg font-semibold">
            How customers paid
          </h2>
          <p className="mt-1 text-sm text-ink-soft">Payments received, {range.label.toLowerCase()}.</p>
          {d.byMethod.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">No payments in this period. Try a wider date range.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {d.byMethod.map((m) => {
                const share = d.revenue.total > 0 ? (m.amount / d.revenue.total) * 100 : 0;
                return (
                  <li key={m.method}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium">{METHOD_LABELS[m.method as PaymentMethodValue] ?? m.method}</span>
                      <span className="tabular-nums text-ink-soft">
                        {money(m.amount)} · {m.n.toLocaleString("en-IN")} payments
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${share}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <p className="mt-6 text-xs text-ink-faint">
        Figures as of {formatDate(today)}. Calculated in {ms} ms with SQL COUNT and SUM.
      </p>
    </div>
  );
}
