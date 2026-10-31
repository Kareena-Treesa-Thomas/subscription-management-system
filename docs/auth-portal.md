# Anjanapriya: Auth, Roles, Portal, App Shell

## Run it
```bash
docker compose up -d
cp .env.example .env          # then set AUTH_SECRET (npx auth secret)
npm install
npx prisma migrate dev --name init && npx prisma db seed
npm run dev
```
Demo logins (password `Admin@12345`): admin@brightloop.test, staff@brightloop.test, customer@brightloop.test, other@brightloop.test

## What's in here
| Done-when from the plan | Where |
|---|---|
| Customer sees only own data | `src/app/(portal)/portal/*` queries filter by `customerId = session user`; actions check ownership |
| Only admin adds staff | middleware (`/staff`), `requireRole("ADMIN")` in page AND `createStaffAction` |
| Reset flow works | `actions/auth.ts` (hashed, single-use, 30 min token) → `/reset-password/[token]`. No SMTP → link prints in console and on screen |
| Password rules + unique email | `lib/validation.ts` (Zod, client + server), unique index + pre-check |
| `requireRole()` | `src/lib/rbac.ts` (share with team by 11:00) |
| App shell | `components/staff-shell.tsx` (sidebar, admin/staff), `components/customer-nav.tsx` (top nav, customers) |

## Tell the team (hand-off)
- **Pages go in `src/app/(staff)/<route>/page.tsx`** to get the sidebar automatically. Routes in the sidebar: `/dashboard /subscriptions /invoices /payments /products /discounts(admin) /staff(admin)`
- Start every page/action with `const user = await requireRole("ADMIN", "STAFF")`
- Replace `(staff)/dashboard/page.tsx` (Shivani). Sidebar links 404 until teammates merge their pages.
- Add a nav item: edit the `NAV` array in `staff-shell.tsx`.

## Merge notes (schema)
`prisma/schema.prisma` has minimal Plan/Subscription/Invoice so this runs alone. When merging with Kareena's schema, keep her models and add mine: `User.role`, `User.passwordHash`, `PasswordResetToken`, and `PAUSED` in `SubscriptionStatus`. The portal reads: `Subscription{number,status,quantity,startDate,expiryDate,paymentTerms,plan}`, `Plan{name,price,billingPeriod,pausable,closable,renewable}`, `Invoice{number,status,periodStart,periodEnd,dueDate,total}`. Rename fields in `portal/page.tsx` if hers differ.

## Notes
- `bcryptjs` (pure JS) instead of `bcrypt`: no native build problems on Windows.
- shadcn-style components are hand-written in `components/ui.tsx` (no CLI step).
- Remove the on-screen reset link (`devLink`) once SMTP works.

## Commit as you go (your own git identity)
```
feat(auth): add signup, login and Zod password validation
feat(rbac): add requireRole helper and role-aware middleware
feat(shell): add sidebar and customer top nav
feat(auth): add forgot and reset password flow
feat(staff): add admin-only staff creation
feat(portal): add customer subscriptions and invoices
```
