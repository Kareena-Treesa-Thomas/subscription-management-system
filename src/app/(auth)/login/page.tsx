import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";

export const metadata = { title: "Sign in — Brightloop" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string; role?: string }> }) {
  const { reset, role } = await searchParams;
  const isCustomer = role === "customer";
  const isAdmin = role === "admin";
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">{isCustomer ? "Customer portal sign in" : isAdmin ? "Team sign in" : "Welcome back"}</h1>
      <p className="mb-6 mt-1.5 text-sm text-ink-soft">{isCustomer ? "View your subscriptions, invoices, and account activity." : "Sign in to manage subscriptions, billing, and invoices."}</p>
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-1 text-sm">
        <Link href="/login?role=admin" className={`rounded-lg px-3 py-2 text-center font-semibold transition ${!isCustomer ? "bg-white text-brand-700 shadow-sm" : "text-ink-soft hover:text-ink"}`}>Admin / staff</Link>
        <Link href="/login?role=customer" className={`rounded-lg px-3 py-2 text-center font-semibold transition ${isCustomer ? "bg-white text-brand-700 shadow-sm" : "text-ink-soft hover:text-ink"}`}>Customer</Link>
      </div>
      <LoginForm resetOk={reset === "1"} initialEmail={isCustomer ? "customer@brightloop.test" : isAdmin ? "admin@brightloop.test" : ""} initialPassword={isCustomer || isAdmin ? "Admin@12345" : ""} />
      <p className="mt-6 text-center text-sm text-ink-soft">
        New to Brightloop? <Link href="/signup" className="font-medium text-brand-600 hover:underline">Create an account</Link>
      </p>
    </>
  );
}
