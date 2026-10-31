import Link from "next/link";
import { ArrowUpRight, CalendarDays, CircleDollarSign, FileWarning, Plus, Receipt, Users } from "lucide-react";
import { Badge, Card, PageHeader, statusTone } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export default async function DashboardPage() {
  const user = await requireRole("ADMIN", "STAFF");
  const [subscriptions, invoices, activeCount, paid] = await Promise.all([
    prisma.subscription.findMany({ include: { customer: true, plan: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.invoice.findMany({ include: { customer: true }, orderBy: { issueDate: "desc" }, take: 5 }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.invoice.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
  ]);
  const outstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.total) - Number(invoice.amountPaid), 0);
  const money = (value: number) => `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const cards = [
    { label: "Active Subscriptions", value: String(activeCount), icon: Users, tone: "text-blue-600 bg-blue-50" },
    { label: "Revenue", value: money(Number(paid._sum.total ?? 0)), icon: CircleDollarSign, tone: "text-violet-600 bg-violet-50" },
    { label: "Outstanding", value: money(outstanding), icon: FileWarning, tone: "text-amber-600 bg-amber-50" },
    { label: "Recent Invoices", value: String(invoices.length), icon: Receipt, tone: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Your subscription business at a glance, ${user.name?.split(" ")[0] ?? "there"}.`}
        action={<Link href="/subscriptions" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"><Plus className="h-4 w-4" /> New Subscription</Link>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span><span className="text-xs font-semibold text-emerald-600">↑ 12%</span></div>
            <p className="mt-4 text-sm text-ink-soft">{label}</p><p className="mt-1 text-2xl font-extrabold tracking-tight">{value}</p>
          </Card>
        ))}
      </div>
      <div className="mb-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between"><div><h2 className="font-bold">Revenue Trend</h2><p className="text-sm text-ink-soft">Monthly recurring revenue</p></div><div className="flex gap-1 rounded-lg bg-brand-50 p-1 text-xs"><span className="rounded-md bg-brand-500 px-2 py-1 font-semibold text-white">6M</span><span className="px-2 py-1 text-brand-700">1Y</span></div></div>
          <div className="mt-6 flex h-44 items-end gap-3 border-b border-l border-line px-3 pt-4">{[30, 48, 42, 66, 58, 84, 73, 96].map((height, i) => <div key={i} className="group flex h-full flex-1 items-end"><span className="w-full rounded-t-lg bg-gradient-to-t from-brand-400 to-brand-200 transition-all group-hover:from-brand-500" style={{ height: `${height}%` }} /></div>)}</div>
          <div className="mt-3 flex justify-between text-xs text-ink-mute"><span>Jul 2026</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec 2026</span></div>
        </Card>
        <Card className="p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold">Quick Actions</h2><p className="text-sm text-ink-soft">Common workflows</p></div><CalendarDays className="h-5 w-5 text-brand-500" /></div><div className="mt-5 grid gap-3"><Link href="/subscriptions" className="flex items-center justify-between rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600">New Subscription <ArrowUpRight className="h-4 w-4" /></Link><Link href="/invoices" className="rounded-xl border border-brand-200 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">Create Invoice</Link><Link href="/payments" className="rounded-xl border border-brand-200 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">Record Payment</Link></div></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="font-bold">Recent Subscriptions</h2><Link href="/subscriptions" className="text-sm font-semibold text-brand-600">View all →</Link></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-brand-50/60 text-xs uppercase text-ink-mute"><tr><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{subscriptions.map((s) => <tr key={s.id} className="border-t border-line"><td className="px-5 py-3 font-medium">{s.customer.name}</td><td className="px-5 py-3 text-ink-soft">{s.plan.name}</td><td className="px-5 py-3"><Badge tone={statusTone[s.status]}>{s.status}</Badge></td></tr>)}</tbody></table></div></Card>
        <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="font-bold">Recent Invoices</h2><Link href="/invoices" className="text-sm font-semibold text-brand-600">View all →</Link></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-brand-50/60 text-xs uppercase text-ink-mute"><tr><th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{invoices.map((i) => <tr key={i.id} className="border-t border-line"><td className="px-5 py-3 font-medium">{i.number}</td><td className="px-5 py-3">{money(Number(i.total))}</td><td className="px-5 py-3"><Badge tone={statusTone[i.status]}>{i.status}</Badge></td></tr>)}</tbody></table></div></Card>
      </div>
    </>
  );
}
