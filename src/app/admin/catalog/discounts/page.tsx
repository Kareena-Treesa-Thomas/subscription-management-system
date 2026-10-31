"use client";
import CrudManager, { money, fmtDate, badge } from "@/components/catalog/CrudManager";
import { discountSchema } from "@/lib/validation/catalog";

export default function DiscountsPage() {
  return (
    <CrudManager
      entity="discounts" title="Discount rules" singular="discount" schema={discountSchema}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "type", label: "Type", type: "select", required: true, defaultValue: "PERCENTAGE",
          options: [{ value: "PERCENTAGE", label: "Percentage (%)" }, { value: "FIXED", label: "Fixed amount (₹)" }] },
        { name: "value", label: "Value", type: "number", required: true },
        { name: "scope", label: "Applies to", type: "select", required: true, defaultValue: "SUBSCRIPTION",
          options: [{ value: "SUBSCRIPTION", label: "Whole subscription" }, { value: "PRODUCT", label: "Specific product" }] },
        { name: "productId", label: "Product (for product scope)", type: "select", optionsUrl: "/api/catalog/products", allowEmpty: true },
        { name: "minPurchaseAmount", label: "Minimum purchase (₹)", type: "number" },
        { name: "minQuantity", label: "Minimum quantity", type: "number", step: "1" },
        { name: "startDate", label: "Start date", type: "date", required: true },
        { name: "endDate", label: "End date", type: "date" },
        { name: "usageLimit", label: "Usage limit", type: "number", step: "1", help: "Leave empty for unlimited" },
        { name: "active", label: "Active", type: "checkbox", defaultValue: true },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "value", label: "Discount", render: (r) => (r.type === "PERCENTAGE" ? `${Number(r.value)}%` : money(r.value)) },
        { key: "scope", label: "Scope", render: (r) => (r.scope === "PRODUCT" ? r.product?.name ?? "Product" : "Subscription") },
        { key: "min", label: "Minimum", render: (r) => [r.minPurchaseAmount != null && money(r.minPurchaseAmount), r.minQuantity != null && `${r.minQuantity} qty`].filter(Boolean).join(" · ") || "—" },
        { key: "dates", label: "Valid", render: (r) => `${fmtDate(r.startDate)} → ${fmtDate(r.endDate)}` },
        { key: "usage", label: "Used", render: (r) => `${r.timesUsed}${r.usageLimit != null ? ` / ${r.usageLimit}` : ""}` },
        { key: "active", label: "Status", render: (r) => badge(r.active) },
      ]}
    />
  );
}
