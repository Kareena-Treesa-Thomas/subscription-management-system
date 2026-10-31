# Brightloop Subscription Management System

Brightloop is a full-stack subscription management and finance application for
the Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026. It manages products, plans,
quotations, subscriptions, recurring invoices, discounts, taxes, payments,
customer access, and finance reporting.

The application is built to run locally with Next.js, Prisma, and PostgreSQL.
It uses real database records rather than static demo JSON.

## Product brief

Brightloop Software sells business software, add-ons, and product variants on
monthly and yearly subscriptions. Before this system, subscriptions lived in
spreadsheets, renewals depended on reminders, invoices were typed manually,
payments were matched from bank statements, and revenue reports were assembled
at the end of each quarter.

This application provides one workflow for the complete subscription lifecycle:

1. A customer creates a unique account with a strong password and can recover
   access through a reset link.
2. An administrator configures products, variants, plans, tax rules, and
   discounts.
3. Staff create a subscription directly or from a quotation template.
4. The billing engine creates invoices for due subscriptions with lines, tax,
   discounts, and totals already calculated.
5. Finance records payments against invoices and sees paid, outstanding, and
   overdue balances.
6. The dashboard reports active subscriptions, collected revenue, outstanding
   balances, overdue aging, MRR, and ARR.
7. Customers use the portal to view only their own subscriptions and invoices.

The design supports ordinary billing-month scenarios including launching a new
plan, converting a quote, billing hundreds of subscriptions, applying
quantity-based discounts automatically, recording payments received through
different methods, and simulating a future date for a deterministic demo.

## Business requirements covered

### New customer registration

- Email addresses are unique.
- Passwords must exceed eight characters and include uppercase, lowercase, and
  special characters.
- Customers can sign in, sign out, request a reset link, and set a new
  password.
- Role-based access separates administrators, staff, and customers.
- Customers can access only their own portal data.
- Only administrators can create staff accounts.

### Product and plan launch

- Products contain name, type, sales price, cost price, and notes.
- Variants can add an extra price, such as the Odoo brand surcharge.
- Plans support daily, weekly, monthly, and yearly billing.
- Plans support minimum quantities, availability dates, auto-close, early close,
  pause, and renewal rules.
- Administrators control tax and discount configuration.

### Quote-to-subscription workflow

- Quotation templates define a plan, product lines, and validity period.
- A subscription receives a unique number, customer, plan, dates, payment terms,
  and detailed subscription lines.
- The lifecycle is `DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE -> CLOSED`.

### Billing month

- Due active subscriptions are billed by the billing engine.
- Invoices contain customer data, product lines, tax, discounts, and totals.
- Billing is idempotent and does not create duplicate invoices for a period.
- Teams can confirm, cancel, send, and record payment against invoices.
- Simulated dates allow billing and overdue scenarios to be demonstrated without
  changing the machine clock.

### Finance operations

- Payments capture method, amount, date, note, invoice, and authenticated actor.
- Partial payments are supported.
- Overpayments, future-dated payments, and payments on invalid invoice states
  are rejected.
- Invoice balances and paid status update atomically.
- Finance users can filter and paginate operational lists.
- Dashboard aggregates are computed from PostgreSQL data and support thousands
  of subscription records.

## Features

### Subscription and billing

- Subscription lifecycle: `DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE -> CLOSED`
- Subscription lines with quantities, unit prices, taxes, and line totals
- Quotation templates and subscription creation from a template
- Automatic invoice generation for due subscriptions
- Idempotent billing using a unique subscription/period constraint
- Invoice lifecycle: `DRAFT -> CONFIRMED -> PAID`
- Invoice cancellation and send actions
- Automatic tax calculation
- Fixed and percentage discounts
- Product-scoped and subscription-scoped discounts
- Minimum purchase and quantity rules
- Discount date windows and usage limits
- Simulated-date support for deterministic demos and billing tests

### Authentication and roles

- Auth.js credentials authentication
- Bcrypt password verification
- Signup and password-strength validation
- Forgot-password and reset-password flow
- Session-based role propagation
- Roles:
  - `ADMIN`: full administrative access
  - `STAFF`: operational access to subscriptions, invoices, and payments
  - `CUSTOMER`: own subscriptions and invoices through the portal
- Customer data is restricted by the authenticated customer ID
- API authorization returns `401` for unauthenticated requests and `403` for
  authenticated users without the required role

### Payments and finance

- Payment methods, amount, payment date, and note
- Partial payments
- Overpayment protection
- Future-date validation
- Payments recorded against confirmed invoices only
- Automatic invoice balance updates
- Automatic `PAID` transition when the balance reaches zero
- Authenticated payment actor stored in `Payment.recordedById`
- Dashboard metrics for:
  - Active subscriptions
  - Revenue collected
  - Outstanding balances
  - Overdue invoices
  - Monthly recurring revenue (MRR)
  - Annual recurring revenue (ARR)
  - Overdue aging buckets
- Filtering and pagination for operational lists

## Technology

| Layer | Technology |
|---|---|
| Application | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS and shared UI components |
| Authentication | Auth.js credentials provider |
| Passwords | bcryptjs |
| Validation | Zod |
| Database | PostgreSQL 16 |
| ORM | Prisma 6 |
| Testing | Vitest and Node.js test runner |
| Local infrastructure | Docker Compose |

## Requirements

Install the following before starting:

- Node.js 20 or newer
- npm
- Docker Desktop with Docker Compose
- Git

On Windows, if Node.js or Docker is installed but not visible in a new
PowerShell session, restart the terminal or temporarily add the paths:

```powershell
$env:Path += ";C:\Program Files\nodejs"
$env:Path += ";C:\Program Files\Docker\Docker\resources\bin"
```

Verify the tools:

```powershell
node --version
npm --version
docker --version
docker compose version
```

## Run locally in 5 steps

From a PowerShell terminal:

```powershell
git clone https://github.com/Kareena-Treesa-Thomas/subscription-management-system.git
cd subscription-management-system
docker compose up -d
Copy-Item .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open the URL printed by Next.js, normally:

```text
http://localhost:3000
```

If port 3000 is occupied, Next.js chooses another port such as 3001. Always
use the URL printed in the terminal.

## Environment configuration

`.env` is local-only and is ignored by Git. Start with `.env.example`:

```env
DATABASE_URL="postgresql://brightloop:brightloop@localhost:5432/brightloop"
DIRECT_URL="postgresql://brightloop:brightloop@localhost:5432/brightloop"
AUTH_SECRET="replace-with-a-long-random-secret"
ALLOW_DEV_ROLE_HEADER="true"
```

`AUTH_SECRET` must be changed for any deployed environment. Generate a local
secret with Node.js:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

The development role-header fallback is intended only for local API testing.
Normal application authentication uses Auth.js sessions.

## Local database

The root [docker-compose.yml](./docker-compose.yml) starts PostgreSQL 16:

| Setting | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `brightloop` |
| User | `brightloop` |
| Password | `brightloop` |

Useful commands:

```powershell
docker compose up -d
docker compose ps
docker compose logs db
docker compose down
```

Prisma commands:

```powershell
npx prisma generate
npx prisma migrate status
npx prisma migrate dev
npx prisma db seed
```

`npx prisma migrate reset --force` deletes all data in the selected database.
Use it only for the disposable local Docker database. Never run it against a
shared, staging, or production database.

## Demo accounts

The local seed creates:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@brightloop.test` | `Admin@12345` |
| Customer | `customer@brightloop.test` | `Admin@12345` |

The customer account is useful for verifying portal isolation. Add staff
accounts through the administrative flow rather than sharing credentials.

## Application routes

### Public and authentication routes

```text
/login
/signup
/forgot-password
/reset-password/[token]
```

### Staff and administration routes

```text
/dashboard
/subscriptions
/invoices
/payments
/products
/discounts
/admin/catalog
/admin/catalog/products
/admin/catalog/variants
/admin/catalog/plans
/admin/catalog/taxes
/admin/catalog/discounts
/staff
```

### Customer portal routes

```text
/portal
/portal/invoices
```

## API reference

All API routes use JSON where a request body is required. Role-protected
routes use the Auth.js session from the current request.

### Billing and subscriptions

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/billing/run` | Bill all due active subscriptions |
| `GET` | `/api/subscriptions` | List subscriptions |
| `POST` | `/api/subscriptions` | Create a subscription |
| `POST` | `/api/subscriptions/from-template` | Create from a quotation template |
| `POST` | `/api/subscriptions/[id]/transition` | Change subscription status |
| `GET` | `/api/quotation-templates` | List quotation templates |
| `POST` | `/api/quotation-templates` | Create a quotation template |

Billing is idempotent. Running the billing endpoint repeatedly does not create
duplicate invoices for the same subscription and billing period.

### Invoices and payments

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/invoices` | List invoices |
| `POST` | `/api/invoices/[id]/confirm` | Confirm a draft invoice |
| `POST` | `/api/invoices/[id]/cancel` | Cancel an invoice when allowed |
| `POST` | `/api/invoices/[id]/send` | Mark an invoice as sent |
| `POST` | `/api/invoices/[id]/payments` | Record a payment |

Payment input:

```json
{
  "method": "CARD",
  "amount": "500.00",
  "paidOn": "2026-10-31",
  "note": "Paid at front desk"
}
```

Payment rules:

- Amount must be positive.
- Amount cannot exceed the remaining invoice balance.
- Payment dates cannot be in the future relative to the application date.
- Draft invoices must be confirmed first.
- Cancelled and already-paid invoices reject payments.
- Customers can pay only their own confirmed invoices.
- Partial payments are allowed.
- A fully settled invoice changes to `PAID`.

### Simulated date

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/admin/simulate-date` | Read simulated and effective dates |
| `POST` | `/api/admin/simulate-date` | Set or clear the simulated date |

Set a date:

```json
{ "date": "2026-12-01" }
```

Clear it:

```json
{ "date": null }
```

The value is stored in `AppSetting` with key `simulated_date` and format
`YYYY-MM-DD`. Application code should use `getToday()` from
[src/lib/clock.ts](./src/lib/clock.ts) instead of calling `new Date()` for
business-date logic.

## Development authentication headers

For local API testing, the development fallback can use:

```text
x-dev-role: ADMIN
x-dev-user: demo-admin
```

This works only when `ALLOW_DEV_ROLE_HEADER="true"` and no valid Auth.js
session is present. It must not be enabled for production.

Example:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri http://localhost:3000/api/invoices `
  -Headers @{ "x-dev-role" = "ADMIN"; "x-dev-user" = "demo-admin" }
```

## Project structure

```text
prisma/
  migrations/              Prisma migration history
  schema.prisma            Shared data model
  seed.ts                  Local demo seed

src/
  actions/                 Server actions for auth and staff workflows
  app/                     Next.js routes, pages, and API handlers
  components/              Shared UI and form components
  lib/
    billing/               Billing engine and period calculations
    catalog/               Products, plans, tax, and discounts
    invoice/               Invoice and payment services
    subscription/          Subscription lifecycle services
    auth/                  API authorization guard
    clock.ts               Effective/simulated business date
    prisma.ts              Prisma client
    validation.ts          Shared Zod schemas
  auth.ts                  Auth.js credentials configuration
  auth.config.ts           Edge-safe Auth.js configuration

tests/
  billing.test.ts          Billing, tax, discount, and idempotency tests
  auth-validation.test.ts  Auth validation tests
  catalog/                 Node.js test-runner catalog tests
```

The nested `brightloop-finance/` directory is a separate finance module with
its own package manifest, Prisma version, and build configuration. The root
TypeScript configuration excludes it so the two applications do not interfere
with each other.

## Data model overview

The main Prisma schema includes:

- `User`, `PasswordResetToken`
- `Product`, `ProductVariant`
- `Tax`
- `Plan`
- `Discount`, `DiscountRedemption`
- `QuotationTemplate`, `QuotationTemplateLine`
- `Subscription`, `SubscriptionLine`
- `Invoice`, `InvoiceLine`
- `Payment`
- `AppSetting`

Important constraints and indexes include:

- Unique user email
- Unique subscription number
- Unique invoice number
- Unique subscription and invoice period
- Unique discount redemption per invoice
- Subscription status and next-invoice-date indexes
- Invoice status and due-date indexes
- Payment invoice index
- Payment actor foreign key with nullable `recordedById`

## Testing and quality checks

Run the Vitest suites:

```powershell
npm test
```

Run the catalog tests, which use Node's built-in test runner:

```powershell
npm run test:catalog
```

Run TypeScript validation:

```powershell
npm run typecheck
```

Build the production application:

```powershell
npm run build
```

Recommended complete local check:

```powershell
npm test
npm run test:catalog
npm run typecheck
npm run build
```

The billing tests expect fresh local seed state because the demo discount has a
usage limit. If previous runs have consumed it, reset only the local database:

```powershell
npx prisma migrate reset --force
npm test
```

## Demo flow

1. Sign in as the admin.
2. Open the catalog and review the seeded product, variant, plan, tax, and
   discount.
3. Create or open a subscription from a quotation template.
4. Move it through quotation and confirmation.
5. Run billing.
6. Open the generated invoice and verify tax and discount totals.
7. Record a partial payment.
8. Record the remaining balance and verify the invoice becomes `PAID`.
9. Set a simulated date one month ahead.
10. Run billing again and verify the next period is created.
11. Review dashboard revenue, outstanding, overdue, MRR, ARR, and aging data.
12. Sign in as the customer and verify that only that customer's subscriptions
    and invoices are visible.

## Troubleshooting

### `npm` or `npx` is not recognized

Add Node.js to the current PowerShell session or restart the terminal:

```powershell
$env:Path += ";C:\Program Files\nodejs"
```

### `docker` is not recognized

Start Docker Desktop and add its CLI path:

```powershell
$env:Path += ";C:\Program Files\Docker\Docker\resources\bin"
docker compose up -d
```

### Port 3000 is already in use

Use the alternate URL printed by `npm run dev`, or stop the specific process
holding the port.

### Prisma reports migration drift

Check the state first:

```powershell
npx prisma migrate status
```

If the database is disposable local data, reset it:

```powershell
npx prisma migrate reset --force
```

Never reset a shared database.

### Billing test reports `discountTotal` as zero

The seeded discount may have reached its usage limit. Reset the local database
and reseed:

```powershell
npx prisma migrate reset --force
npm test
```

### Vitest discovers dependency tests

The root [vitest.config.ts](./vitest.config.ts) limits discovery to
`tests/**/*.test.ts` and excludes the nested finance module and `node_modules`.
Catalog tests are intentionally run with `npm run test:catalog`.

### Auth returns `CredentialsSignin`

Confirm that:

1. `AUTH_SECRET` exists in `.env`.
2. The database has been seeded.
3. You are using `admin@brightloop.test` and `Admin@12345`.
4. The application is connected to the same local database that was seeded.

## Security and scope notes

- Never commit `.env`, passwords, API keys, or production database URLs.
- Use local/test data for development and demonstrations.
- Do not run database reset or reseed commands against shared databases.
- Customer authorization must always use the authenticated customer ID.
- Do not add checkout, refunds, PDF receipts, or unrelated features without an
  explicit scope decision.
- Replace development secrets and disable development auth headers before
  deployment.

## Git workflow

Pull before pushing:

```powershell
git status
git pull --rebase origin main
git push origin main
```

Never force-push to `main`. Keep commits focused and use descriptive messages,
for example:

```text
feat(billing): add idempotent invoice generation
fix(auth): enforce customer invoice ownership
test(billing): cover partial payment settlement
```

## License

See [LICENSE](./LICENSE).
