// Seed data for the finance module.
//   npx prisma db seed                 1,200 subscriptions + invoices + payments, plus a small demo set
//   npm run db:seed:demo               only the small, clean demo set
//   npm run db:reseed                  wipes users/plans/subscriptions/invoices/payments first, then seeds
// Safe by default: if the demo admin already exists, the seed stops instead of overwriting anything.
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();
const DEMO_ONLY = process.argv.includes("--demo-only");
const RESET = process.argv.includes("--reset");
const SUB_COUNT = Number(process.env.SEED_SUBS ?? 1200);
const CUSTOMER_COUNT = 400;

type Period = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
type SubStatus = "DRAFT" | "QUOTATION" | "CONFIRMED" | "ACTIVE" | "CLOSED";
type Outcome = "paid" | "partial" | "open" | "draft" | "cancelled";
type PlanRow = { id: string; name: string; price: number; period: Period };
type SubRow = { id: string; customerId: string; plan: PlanRow; quantity: number; recurring: number };

const DAY = 86_400_000;

// ---------- deterministic randomness, so every teammate gets the same data ----------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261031);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

// ---------- dates ----------
function realToday(): Date {
  const tz = process.env.APP_TZ || "Asia/Kolkata";
  const s = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return new Date(`${s}T00:00:00.000Z`);
}
const TODAY = realToday();
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
function addMonths(d: Date, n: number) {
  const x = new Date(d.getTime());
  x.setUTCMonth(x.getUTCMonth() + n);
  return x;
}
function nextPeriod(d: Date, p: Period): Date {
  if (p === "DAILY") return addDays(d, 1);
  if (p === "WEEKLY") return addDays(d, 7);
  if (p === "MONTHLY") return addMonths(d, 1);
  return addMonths(d, 12);
}
function clampDay(d: Date): Date {
  const x = new Date(d.getTime());
  if (x.getUTCDate() > 28) x.setUTCDate(28);
  return x;
}

async function insertInChunks<T>(rows: T[], size: number, fn: (part: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += size) await fn(rows.slice(i, i + size));
}

// ---------- names ----------
const FIRST = ["Anil", "Meera", "Rahul", "Divya", "Joseph", "Fathima", "Arjun", "Sneha", "Vishnu", "Anjali", "Thomas", "Nimisha", "Suresh", "Lakshmi", "Faisal", "Reshma", "George", "Aparna", "Nikhil", "Haritha"];
const LAST = ["Nair", "Menon", "Thomas", "Pillai", "Varghese", "Kurian", "Das", "Iyer", "Joseph", "Mathew", "Krishnan", "Rao", "Shah", "Khan", "George", "Philip", "Warrier", "Kaimal", "Cherian", "Mohan"];
const CO_A = ["Kerala", "Malabar", "Backwater", "Spice", "Coastal", "Harbour", "Lotus", "Western Ghats", "Periyar", "Cochin", "Trident", "Bluewave", "Evergreen", "Skyline", "Northstar"];
const CO_B = ["Traders", "Retail", "Logistics", "Foods", "Clinics", "Studios", "Textiles", "Hardware", "Travels", "Learning", "Pharmacy", "Interiors", "Agencies", "Labs", "Stores"];

const PLAN_DEFS: { name: string; price: number; period: Period; weight: number }[] = [
  { name: "Starter (monthly)", price: 999, period: "MONTHLY", weight: 30 },
  { name: "Business (monthly)", price: 2499, period: "MONTHLY", weight: 30 },
  { name: "Business (yearly)", price: 24990, period: "YEARLY", weight: 12 },
  { name: "Enterprise (yearly)", price: 99900, period: "YEARLY", weight: 6 },
  { name: "Team add-on (weekly)", price: 299, period: "WEEKLY", weight: 4 },
  { name: "Pilot (daily)", price: 49, period: "DAILY", weight: 1 },
];

function weightedPlan(plans: PlanRow[]): PlanRow {
  const total = PLAN_DEFS.reduce((s, p) => s + p.weight, 0);
  let r = rand() * total;
  for (let i = 0; i < PLAN_DEFS.length; i++) {
    r -= PLAN_DEFS[i].weight;
    if (r <= 0) return plans[i];
  }
  return plans[0];
}

// ---------- invoice + payments builder ----------
type Built = {
  invoice: Prisma.InvoiceCreateManyInput;
  line: Prisma.InvoiceLineCreateManyInput;
  payments: Prisma.PaymentCreateManyInput[];
};

const METHODS = ["UPI", "UPI", "UPI", "BANK_TRANSFER", "BANK_TRANSFER", "CARD", "CARD", "CASH", "CHEQUE"] as const;

function payDate(from: Date, spread: number): Date {
  const d = addDays(from, 1 + Math.floor(rand() * spread));
  return d > TODAY ? TODAY : d;
}

function buildInvoice(sub: SubRow, periodStart: Date, outcome: Outcome, number: string, discountPct: number): Built {
  const periodEnd = addDays(nextPeriod(periodStart, sub.plan.period), -1);
  const issue = periodStart;
  const due = addDays(issue, 15);

  const subtotalC = Math.round(sub.recurring * 100);
  const discountC = Math.round((subtotalC * discountPct) / 100);
  const taxC = Math.round((subtotalC - discountC) * 0.18);
  const totalC = subtotalC - discountC + taxC;
  const id = randomUUID();

  const payments: Prisma.PaymentCreateManyInput[] = [];
  let paidC = 0;

  if (outcome === "paid") {
    paidC = totalC;
    if (rand() < 0.15 && totalC > 2) {
      const first = Math.floor(totalC / 2);
      const d1 = payDate(issue, 20);
      payments.push({ id: randomUUID(), invoiceId: id, method: pick(METHODS), amount: first / 100, paidOn: d1, note: "Part 1 of 2" });
      payments.push({ id: randomUUID(), invoiceId: id, method: pick(METHODS), amount: (totalC - first) / 100, paidOn: payDate(d1, 10), note: "Part 2 of 2" });
    } else {
      payments.push({ id: randomUUID(), invoiceId: id, method: pick(METHODS), amount: totalC / 100, paidOn: payDate(issue, 20) });
    }
  } else if (outcome === "partial") {
    paidC = Math.floor(totalC * (0.3 + rand() * 0.4));
    payments.push({ id: randomUUID(), invoiceId: id, method: pick(METHODS), amount: paidC / 100, paidOn: payDate(issue, 20), note: "Advance" });
  }

  const status = outcome === "draft" ? "DRAFT" : outcome === "cancelled" ? "CANCELLED" : outcome === "paid" ? "PAID" : "CONFIRMED";

  return {
    invoice: {
      id,
      number,
      subscriptionId: sub.id,
      customerId: sub.customerId,
      status,
      periodStart,
      periodEnd,
      issueDate: issue,
      dueDate: due,
      subtotal: subtotalC / 100,
      discountTotal: discountC / 100,
      taxTotal: taxC / 100,
      total: totalC / 100,
      amountPaid: paidC / 100,
    },
    line: {
      id: randomUUID(),
      invoiceId: id,
      description: `${sub.plan.name} × ${sub.quantity}`,
      quantity: sub.quantity,
      unitPrice: sub.plan.price,
      taxAmount: taxC / 100,
      amount: (subtotalC - discountC) / 100,
    },
    payments,
  };
}

function chooseOutcome(due: Date, isLatest: boolean): Outcome {
  const r = rand();
  if (rand() < 0.01) return "cancelled";
  const overdueDays = (TODAY.getTime() - due.getTime()) / DAY;
  if (overdueDays > 45) return r < 0.92 ? "paid" : r < 0.96 ? "partial" : "open";
  if (overdueDays > 0) return r < 0.5 ? "paid" : r < 0.6 ? "partial" : "open";
  if (isLatest && r < 0.03) return "draft";
  return r < 0.25 ? "paid" : "open";
}

async function main() {
  const adminExists = await prisma.user.findUnique({ where: { email: "admin@brightloop.test" } });
  if (adminExists && !RESET) {
    console.log("Seed data already exists (admin@brightloop.test found). Nothing was changed.");
    console.log("To wipe users, plans, subscriptions, invoices and payments and seed again, run: npm run db:reseed");
    return;
  }
  if (RESET) {
    console.log("Resetting users, plans, subscriptions, invoices and payments…");
    await prisma.payment.deleteMany();
    await prisma.invoiceLine.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.plan.deleteMany();
    await prisma.user.deleteMany();
  }

  // ----- users -----
  const adminHash = await bcrypt.hash("Admin@12345", 10);
  const customerHash = await bcrypt.hash("Brightloop@123", 10);

  const users: Prisma.UserCreateManyInput[] = [
    { id: randomUUID(), name: "Brightloop Admin", email: "admin@brightloop.test", passwordHash: adminHash, role: "ADMIN" },
    { id: randomUUID(), name: "Brightloop Staff", email: "staff@brightloop.test", passwordHash: adminHash, role: "STAFF" },
  ];

  const demoCustomers = [
    { name: "Meera Nair", company: "Malabar Spice Traders" },
    { name: "Arjun Menon", company: "Cochin Logistics" },
    { name: "Divya Pillai", company: "Lotus Clinics" },
    { name: "Joseph Varghese", company: "Backwater Travels" },
    { name: "Fathima Khan", company: "Skyline Interiors" },
    { name: "Suresh Iyer", company: "Evergreen Learning" },
  ].map((c, i) => ({
    id: randomUUID(),
    name: c.name,
    email: `demo.customer${i + 1}@brightloop.test`,
    passwordHash: customerHash,
    role: "CUSTOMER" as const,
    company: c.company,
  }));
  users.push(...demoCustomers);

  const bulkCustomers: Prisma.UserCreateManyInput[] = [];
  if (!DEMO_ONLY) {
    for (let i = 1; i <= CUSTOMER_COUNT; i++) {
      const first = pick(FIRST);
      const last = pick(LAST);
      bulkCustomers.push({
        id: randomUUID(),
        name: `${first} ${last}`,
        email: `${first}.${last}${i}@example.com`.toLowerCase(),
        passwordHash: customerHash,
        role: "CUSTOMER",
        company: `${pick(CO_A)} ${pick(CO_B)}`,
      });
    }
    users.push(...bulkCustomers);
  }
  await insertInChunks(users, 500, (part) => prisma.user.createMany({ data: part }));

  // ----- plans (reuse existing ones if the catalog already has some) -----
  let plans: PlanRow[] = (await prisma.plan.findMany()).map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    period: p.billingPeriod as Period,
  }));
  if (plans.length < PLAN_DEFS.length) {
    await prisma.plan.deleteMany();
    const created: PlanRow[] = PLAN_DEFS.map((p) => ({ id: randomUUID(), name: p.name, price: p.price, period: p.period }));
    await prisma.plan.createMany({
      data: created.map((p) => ({ id: p.id, name: p.name, price: p.price, billingPeriod: p.period })),
    });
    plans = created;
  }

  const subs: Prisma.SubscriptionCreateManyInput[] = [];
  const invoices: Prisma.InvoiceCreateManyInput[] = [];
  const lines: Prisma.InvoiceLineCreateManyInput[] = [];
  const payments: Prisma.PaymentCreateManyInput[] = [];
  const push = (b: Built) => {
    invoices.push(b.invoice);
    lines.push(b.line);
    payments.push(...b.payments);
  };

  // ----- bulk data: 1,000+ subscriptions, invoices and payments to prove the 2-second requirement -----
  if (!DEMO_ONLY) {
    let invSeq = 1;
    for (let i = 1; i <= SUB_COUNT; i++) {
      const plan = weightedPlan(plans);
      const quantity = plan.period === "YEARLY" && plan.price > 50000 ? int(1, 3) : int(1, 10);
      const r = rand();
      const status: SubStatus = r < 0.7 ? "ACTIVE" : r < 0.85 ? "CLOSED" : r < 0.9 ? "CONFIRMED" : r < 0.95 ? "QUOTATION" : "DRAFT";

      const daysAgo = status === "CLOSED" ? int(300, 460) : int(20, 420);
      const startDate = clampDay(addDays(TODAY, -daysAgo));
      const expiryDate = status === "CLOSED" ? addMonths(startDate, int(3, 9)) : addMonths(startDate, 12);

      const sub: SubRow = {
        id: randomUUID(),
        customerId: pick(bulkCustomers).id as string,
        plan,
        quantity,
        recurring: plan.price * quantity,
      };
      subs.push({
        id: sub.id,
        number: `SUB-${String(i).padStart(4, "0")}`,
        customerId: sub.customerId,
        planId: plan.id,
        status,
        startDate,
        expiryDate,
        recurringAmount: sub.recurring,
      });

      if (status !== "ACTIVE" && status !== "CLOSED") continue;

      const boundary = status === "CLOSED" ? expiryDate : TODAY;
      const starts: Date[] = [];
      for (let p = startDate; p <= boundary && p <= TODAY; p = nextPeriod(p, plan.period)) starts.push(p);
      const used = plan.period === "DAILY" || plan.period === "WEEKLY" ? starts.slice(-6) : starts;

      used.forEach((ps, idx) => {
        const isLatest = idx === used.length - 1 && status === "ACTIVE";
        const outcome = chooseOutcome(addDays(ps, 15), isLatest);
        const discount = rand() < 0.06 ? 10 : 0;
        push(buildInvoice(sub, ps, outcome, `INV-${String(invSeq++).padStart(6, "0")}`, discount));
      });
    }
  }

  // ----- small clean demo set (hand-shaped so the demo script reads well) -----
  // Each demo customer has 3 monthly invoices. The latest one falls due in the next few days,
  // so "simulate next month" turns it overdue on camera.
  const demoPlan = plans.find((p) => p.period === "MONTHLY") ?? plans[0];
  const outcomes: Outcome[][] = [
    ["paid", "paid", "open"],
    ["paid", "open", "open"],
    ["paid", "paid", "partial"],
    ["paid", "paid", "open"],
    ["paid", "partial", "open"],
    ["paid", "paid", "open"],
  ];
  let demoInv = 1;
  demoCustomers.forEach((c, i) => {
    const quantity = 2 + i;
    const sub: SubRow = { id: randomUUID(), customerId: c.id, plan: demoPlan, quantity, recurring: demoPlan.price * quantity };
    const start = clampDay(addDays(TODAY, -(62 + 3 + i * 2)));
    subs.push({
      id: sub.id,
      number: `SUB-D${String(i + 1).padStart(3, "0")}`,
      customerId: c.id,
      planId: demoPlan.id,
      status: "ACTIVE",
      startDate: start,
      expiryDate: addMonths(start, 12),
      recurringAmount: sub.recurring,
    });
    outcomes[i].forEach((outcome, k) => {
      const ps = addMonths(start, k);
      if (ps > TODAY) return;
      push(buildInvoice(sub, ps, outcome, `INV-D${String(demoInv++).padStart(4, "0")}`, k === 2 && i % 2 === 0 ? 10 : 0));
    });
  });

  // ----- write everything -----
  await insertInChunks(subs, 1000, (part) => prisma.subscription.createMany({ data: part }));
  await insertInChunks(invoices, 1000, (part) => prisma.invoice.createMany({ data: part }));
  await insertInChunks(lines, 1000, (part) => prisma.invoiceLine.createMany({ data: part }));
  await insertInChunks(payments, 1000, (part) => prisma.payment.createMany({ data: part }));

  try {
    await prisma.$executeRawUnsafe("ANALYZE");
  } catch {
    // not critical
  }

  console.log(
    `Seeded ${users.length} users, ${subs.length} subscriptions, ${invoices.length} invoices, ${payments.length} payments.`,
  );
  console.log("Log in with admin@brightloop.test / Admin@12345 (staff@brightloop.test uses the same password).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
