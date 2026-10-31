# Subscription Management System
Brightloop Software: plans, subscriptions, recurring billing, payments, finance dashboard.
Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026.

## Run locally in 5 steps
1. `git clone https://github.com/Kareena-Treesa-Thomas/subscription-management-system && cd subscription-management-system`
2. `docker compose up -d`
3. `cp .env.example .env`
4. `npm install && npx prisma migrate dev && npx prisma db seed`
5. `npm run dev`  (tests: `npm test`)

## Team areas
| Area | Owner |
|---|---|
| Subscriptions, quotation templates, billing, invoices, simulate date | Kareena |
| Auth, roles, portal, app shell | Anjanapriya V P |
| Catalog, taxes, discount rules | Athira-Maria |
| Payments, dashboard, seed data | Shivani Manoj |

## Contracts between members
- `src/lib/auth/guard.ts` `requireRole(req, ...roles)`: Anjanapriya replaces the dev shim, keep the signature.
- `src/lib/catalog/tax.ts` `calculateTax(amount, taxId)` and `src/lib/catalog/discounts.ts` `getApplicableDiscounts(ctx)`: working defaults exist; Athira-Maria hardens them, keep the signatures.
- `src/lib/invoice/service.ts` `refreshInvoicePaidStatus(tx, invoiceId)`: Shivani calls it after inserting a Payment.
- `src/lib/clock.ts` `getToday()`: use this instead of `new Date()` everywhere so "simulate date" works.

## Billing API (Kareena)
`POST /api/billing/run` · `GET/POST /api/subscriptions` · `POST /api/subscriptions/from-template` · `POST /api/subscriptions/:id/transition` · `GET/POST /api/quotation-templates` · `GET /api/invoices` · `POST /api/invoices/:id/{confirm,cancel,send}` · `POST /api/invoices/:id/payments` · `GET/POST /api/admin/simulate-date`

Payments accept `method`, positive `amount`, and optional `paidOn` and `note`. Payments may be partial; the invoice becomes `PAID` when the recorded total reaches the invoice total. Customers may pay only their own confirmed invoices.

Dev auth until real login lands: send headers `x-dev-role: ADMIN` and `x-dev-user: <user id>`.
