import { Card, EmptyState, PageHeader, Badge } from "@/components/ui";
import { StaffForm } from "@/components/auth-forms";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Staff — Brightloop" };

export default async function StaffPage() {
  await requireRole("ADMIN"); // admin-only (middleware + here + in the server action)
  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return (
    <>
      <PageHeader title="Staff" subtitle="Only admins can add team members. Staff can manage day-to-day billing but can’t create discounts or other staff." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="overflow-hidden">
          {staff.length === 0 ? (
            <EmptyState title="No team members yet" body="Add the first staff member using the form." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-paper text-xs text-ink-soft">
                  <tr><th className="px-5 py-3 font-medium">Name</th><th className="px-5 py-3 font-medium">Email</th><th className="px-5 py-3 font-medium">Role</th><th className="px-5 py-3 font-medium">Added</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {staff.map((s) => (
                    <tr key={s.id}>
                      <td className="px-5 py-3 font-medium">{s.name}</td>
                      <td className="px-5 py-3 text-ink-soft">{s.email}</td>
                      <td className="px-5 py-3"><Badge tone={s.role === "ADMIN" ? "amber" : "blue"}>{s.role === "ADMIN" ? "Admin" : "Staff"}</Badge></td>
                      <td className="px-5 py-3 text-ink-soft">{fmtDate(s.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card className="h-fit p-5">
          <h2 className="mb-4 font-semibold">Add a staff member</h2>
          <StaffForm />
        </Card>
      </div>
    </>
  );
}
