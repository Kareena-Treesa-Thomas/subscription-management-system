export type Role = "ADMIN" | "STAFF" | "CUSTOMER";

export const homeFor = (role?: string) => (role === "CUSTOMER" ? "/portal" : "/dashboard");
export const ADMIN_ONLY_PATHS = ["/staff", "/discounts"];
