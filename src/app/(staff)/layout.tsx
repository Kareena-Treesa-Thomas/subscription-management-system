import { StaffShell } from "@/components/staff-shell";
import { UserMenu } from "@/components/user-menu";
import { requireRole } from "@/lib/rbac";

// Every admin/staff page (dashboard, subscriptions, invoices, payments, products...) goes inside this
// route group so it gets the sidebar shell. Teammates: put your pages under src/app/(staff)/<route>/page.tsx
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN", "STAFF");
  return (
    <StaffShell role={user.role} topRight={<UserMenu name={user.name ?? "User"} email={user.email ?? ""} role={user.role} />}>
      {children}
    </StaffShell>
  );
}
