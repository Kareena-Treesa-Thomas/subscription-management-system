# Brightloop Finance: payments, finance dashboard, seed data

Member 4's part of the Subscription Management System (Odoo x Make-A-Ton 9.0 Kochi Hackathon).
It runs on its own, and it is written to drop into the shared repo.

## Run locally in 5 steps

1. `npm install`
2. `docker compose up -d` (starts Postgres on port 5432)
3. `cp .env.example .env`
4. `npx prisma migrate dev --name init && npx prisma db seed`
5. `npm run dev` and open http://localhost:3000

Log in details are not needed yet. Until the auth module is merged, `DEV_ROLE` in `.env` (ADMIN, STAFF or CUSTOMER) decides who you are.
Seed accounts for later: `admin@brightloop.test` / `Admin@12345`, `staff@brightloop.test` / `Admin@12345`.

## What is built (checklist from the plan)

| Plan item | Where |
|---|---|
| Record payment: method, amount, date, note, against an invoice | `/payments` (panel at the top) and `/invoices/[id]`; API `POST /api/payments` |
| Validate amount, no overpay | `src/lib/validation.ts` (Zod, shared by form and API) and `recordPayment()` in `src/lib/payments.ts` |
| Paid / outstanding / overdue status | `src/lib/status.ts`, shown as badges on every invoice row |
| Finance dashboard: active subscriptions, revenue, outstanding, overdue, MRR/ARR | `/dashboard`, queries in `src/lib/dashboard.ts` |
| Filters (date, status, customer), summary view | Dashboard: date presets, custom range, customer. Invoices: status, customer, search, issue date. Payments: method, customer, search, paid date |
| Overdue aging buckets | Dashboard section "Where the unpaid money is sitting" |
| Seed script: 1,000+ subscriptions, invoices, payments, plus a small demo set | `prisma/seed.ts` |
| Indexes | `prisma/schema.prisma`: `subscriptions(status)`, `invoices(status, due_date)`, `payments(invoice_id)`, plus `payments(paid_on)`, `invoices(issue_date)`, `invoices(customer_id)` |
| Pagination on every list | 20 per page on Invoices and Payments (`Pagination` component, `skip`/`take`) |
| Dashboard numbers via SQL COUNT/SUM | One raw SQL aggregate per number, run in parallel. The page footer shows how many milliseconds it took |

## How the numbers are defined

- **Revenue collected**: sum of payments with a payment date inside the chosen range.
- **Still owed**: total minus amount paid, on invoices with status Confirmed.
- **Overdue**: the same, but only invoices whose due date is before today.
- **MRR**: active subscriptions' recurring amount, normalised to a month (daily x 30, weekly x 52/12, yearly / 12). **ARR** = MRR x 12.
- **Today** is the simulated date if one is set, otherwise the real date (see below).

## Payment rules

- Only Confirmed invoices take payments (Draft, Cancelled and Paid are refused with a clear message).
- The amount must be more than zero, at most 2 decimals, and no more than the balance. Part payments are fine.
- The payment date can't be in the future (relative to the app date).
- The invoice row is locked while a payment is recorded, so two people can't overpay at once.
- When the balance reaches zero, the invoice moves to Paid automatically.

## Merging with the other members' code

**What this module needs from the others** (keep these tables and columns):

- `users`: `id`, `name`, `email`, `role`
- `plans`: `id`, `name`, `billing_period` (DAILY/WEEKLY/MONTHLY/YEARLY)
- `subscriptions`: `id`, `number`, `customer_id`, `plan_id`, `status`, `recurring_amount`
- `invoices`: `id`, `number`, `subscription_id`, `customer_id`, `status` (DRAFT/CONFIRMED/PAID/CANCELLED), `issue_date`, `due_date`, `subtotal`, `discount_total`, `tax_total`, `total`, `amount_paid`
- `invoice_lines`: `invoice_id`, `description`, `quantity`, `unit_price`, `tax_amount`, `amount`

`amount_paid` is a real column on `invoices`. Kareena's billing engine should create invoices with `amount_paid = 0` and status Confirmed when they are confirmed. If her model uses other names, change them in `src/lib/dashboard.ts` and `src/lib/invoices.ts` (column names are only in those SQL strings).

**Steps**

1. Keep your teammates' versions of `User`, `Plan`, `Subscription`, `Invoice` and `InvoiceLine` in `schema.prisma`. Copy over `Payment`, `AppSetting` and the `@@index` lines.
2. Replace the body of `requireRole()` in `src/lib/auth.ts` with Anjanapriya's helper. The call sites stay the same.
3. Replace `components/Sidebar.tsx` and `app/layout.tsx` with the shared app shell, and keep the three links (Dashboard, Invoices, Payments).
4. Kareena's simulate-date button should write the `simulated_date` key (YYYY-MM-DD) to the `app_settings` table. Every page here reads it through `getToday()`. For testing before that exists: `npm run date:set -- 2026-12-01`, and `npm run date:set -- clear` to undo.
5. The seed reuses existing plans if the catalog already has six or more. `npm run db:reseed` wipes users, plans, subscriptions, invoices and payments, so don't run it on a shared database.

## API

| Method and path | What it does |
|---|---|
| `GET /api/payments` | Paginated list. Query: `page`, `q`, `method`, `customerId`, `from`, `to` |
| `POST /api/payments` | Record a payment: `{ invoiceId, method, amount, paidOn, note? }`. 201 on success, 400 for invalid fields, 422 for rule failures |
| `GET /api/invoices` | Paginated list. Query: `page`, `q`, `status` (all, unpaid, outstanding, overdue, paid, draft, cancelled), `customerId`, `from`, `to` |
| `GET /api/dashboard` | All dashboard numbers as JSON. Query: `range` (30d, 90d, ytd, all) or `from` and `to`, plus `customerId` |
| `GET /api/customers?q=` | Customer search for the filter boxes |

## Demo flow for this part

1. Dashboard: show the key numbers, the aging bar and the chart. Point at the "Calculated in N ms" footer.
2. Invoices: filter to Overdue, then open one.
3. Record a part payment, then the rest. The status changes to Paid.
4. Try to overpay once to show the validation message.
5. `npm run date:set -- <date a month ahead>`: the latest demo invoices turn Overdue and the dashboard changes.

## Before the demo: read these files

You are asked to understand every line of AI-assisted code. The five that matter most:
`src/lib/payments.ts` (the payment rules), `src/lib/dashboard.ts` (the SQL), `src/lib/validation.ts`, `prisma/seed.ts`, `prisma/schema.prisma`.

## Suggested commits (one area each, under your own Git identity)

```
feat(payments): add payment schema, validation and record-payment API
feat(payments): add payment form and payments list with filters
feat(dashboard): add finance summary queries and aging buckets
feat(dashboard): add dashboard page, chart and filters
feat(data): add seed script with 1,200 subscriptions and demo set
perf(db): add indexes for status, due date and payments
```

## Not done here

Customer-facing payment (online checkout), refunds, and PDF receipts are outside this part of the plan.
