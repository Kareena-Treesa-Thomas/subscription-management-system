"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  ["products", "Products"],
  ["variants", "Variants"],
  ["plans", "Plans"],
  ["taxes", "Taxes"],
  ["discounts", "Discounts"],
];

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Catalog &amp; Pricing</h1>
      <p className="mb-4 text-sm text-gray-500">Products, variants, plans, taxes and discount rules.</p>
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200">
        {tabs.map(([slug, label]) => {
          const on = path?.startsWith(`/admin/catalog/${slug}`);
          return (
            <Link key={slug} href={`/admin/catalog/${slug}`}
              className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${on ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
              {label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
