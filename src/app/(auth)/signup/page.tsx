import Link from "next/link";
import { SignupForm } from "@/components/auth-forms";

export const metadata = { title: "Create account — Brightloop" };

export default function SignupPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Create your account</h1>
      <p className="mb-6 mt-1.5 text-sm text-ink-soft">See and manage your subscriptions without sending an email.</p>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account? <Link href="/login" className="font-medium text-brand-600 hover:underline">Sign in</Link>
      </p>
    </>
  );
}
