import Link from "next/link";
import { ForgotForm } from "@/components/auth-forms";

export const metadata = { title: "Reset password — Brightloop" };

export default function ForgotPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Reset your password</h1>
      <p className="mb-6 mt-1.5 text-sm text-ink-soft">Enter your registered email and we’ll send you a link that works for 30 minutes.</p>
      <ForgotForm />
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-medium text-brand-600 hover:underline">Back to sign in</Link></p>
    </>
  );
}
