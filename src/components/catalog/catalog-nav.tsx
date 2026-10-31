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

export function CatalogNav() {
  const path = usePathname();
  return (
    <nav aria-label="Catalog" className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200">
      {tabs.map(([slug, label]) => {
        const active = path?.startsWith(`/admin/catalog/${slug}`);
        return (
          <Link
            key={slug}
            href={`/admin/catalog/${slug}`}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${active ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
