import { CatalogNav } from "@/components/catalog/catalog-nav";
import { requireRole } from "@/lib/rbac";

export default async function CatalogLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN");
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Catalog &amp; Pricing</h1>
      <p className="mb-4 text-sm text-gray-500">Products, variants, plans, taxes and discount rules.</p>
      <CatalogNav />
      {children}
    </div>
  );
}
