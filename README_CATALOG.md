# Catalog & Pricing module (Athira-Maria)

Products, variants, plans, taxes and admin-only discount rules, plus the two functions Kareena needs:
`calculateTax()` and `getApplicableDiscounts()`.

This is a starting scaffold. Read it, adapt it, and commit it under YOUR OWN git identity
(organizers require every member to commit their own code and understand it).

## Where files go (copy into the repo root, same paths)
| File | Purpose |
|---|---|
| prisma/catalog.prisma | Models + enums. Paste into prisma/schema.prisma |
| prisma/seed-catalog.ts | Demo taxes, product, variants, plans, discounts |
| src/lib/validation/catalog.ts | Zod schemas, shared by client forms and API |
| src/lib/catalog/*.ts | tax, discount engine, plan helpers, DB wrappers, API helpers |
| src/app/api/catalog/[entity]/... | REST API: products, variants, plans, taxes, discounts |
| src/components/catalog/CrudManager.tsx | Reusable table + form |
| src/app/admin/catalog/... | Admin pages (tabs) |
| tests/catalog/catalog.test.ts | Unit tests for tax, discounts, plans |

## Step by step
1. `git pull`, then `git checkout -b feat/catalog` (or work on main and push hourly).
2. `npm i zod` (skip if installed). Check `src/lib/prisma.ts` exports `prisma`; create it if missing.
3. Paste prisma/catalog.prisma into prisma/schema.prisma. If Kareena's schema already has any of these models, merge fields, do not duplicate.
4. `npx prisma migrate dev --name catalog` then `npx prisma generate`.
5. Copy all other files in. Run `npx tsx --test tests/catalog/catalog.test.ts` (expect 7 passing).
6. `npm run dev`, open /admin/catalog. Create a tax, a product, a variant (Brand / Odoo / 560), a plan, a discount. Try bad input to see validation.
7. Optional demo data: `npx tsx prisma/seed-catalog.ts`, or call `seedCatalog(prisma)` from Shivani's seed.ts.
8. Auth: routes use src/lib/catalog/guard.ts stubs (OPEN for now). When Anjanapriya shares `requireRole()` (~11:00), edit that one file. Then verify a non-admin gets 403 on POST.
9. Hand-off to Kareena (~12:00): `import { calculateTax, calculateLinesTax, getApplicableDiscounts, recordDiscountUsage, getProductPricing, addBillingPeriod } from "@/lib/catalog"`. Tell her: pass the SIMULATED date as the 2nd arg of getApplicableDiscounts, and call recordDiscountUsage inside the invoice-creating transaction.
10. Tell Anjanapriya to link `/admin/catalog` in the sidebar and use `planAllows(plan, "pause" | "close" | "renew")` for portal buttons.
11. Commit small, with messages like `feat(catalog): add product CRUD API` and `feat(pricing): add discount engine`. Push at least hourly. Never force-push.

## Key behaviours
- Price = product sales price + variant extra price (1000 + 560 = 1560).
- Tax is charged on (qty x unit price - discount).
- Discounts: active, inside start/end date (end inclusive), under usage limit, min purchase/quantity met; product scope only counts that product; total never exceeds the subtotal.
- "Delete" is a soft delete (active=false) so old invoices stay valid.
- Lists are paginated (page, pageSize up to 100) and searchable (?q=).

## API
`GET/POST /api/catalog/{products|variants|plans|taxes|discounts}`  (?page=&pageSize=&q=&active=true)
`GET/PATCH/DELETE /api/catalog/{entity}/{id}`  (PATCH takes the full object; DELETE deactivates)
Reads: admin + staff. Writes: admin only (once guard.ts is wired).
