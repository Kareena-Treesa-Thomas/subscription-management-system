import { redirect } from "next/navigation";
export default function CatalogHome() {
  redirect("/admin/catalog/products");
}
