import { CustomerNav } from "@/components/customer-nav";
import { UserMenu } from "@/components/user-menu";
import { requireRole } from "@/lib/rbac";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("CUSTOMER");
  return (
    <div className="min-h-screen">
      <CustomerNav right={<UserMenu name={user.name ?? "Customer"} email={user.email ?? ""} role={user.role} />} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
