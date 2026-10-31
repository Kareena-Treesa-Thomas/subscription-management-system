import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";

export const metadata = { title: "Sign in — Brightloop" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
      <p className="mb-6 mt-1.5 text-sm text-ink-soft">Sign in to manage your subscriptions and invoices.</p>
      <LoginForm resetOk={params.reset === "1"} />
      <p className="mt-6 text-center text-sm text-ink-soft">
        New to Brightloop? <Link href="/signup" className="font-medium text-brand-600 hover:underline">Create an account</Link>
      </p>
    </>
  );
}
