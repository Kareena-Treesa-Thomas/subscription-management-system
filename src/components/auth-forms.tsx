"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Alert, Field } from "@/components/ui";
import { PasswordField } from "@/components/password-field";
import { SubmitButton } from "@/components/submit-button";
import { forgotPasswordAction, loginAction, resetPasswordAction, signupAction } from "@/actions/auth";
import { createStaffAction } from "@/actions/staff";
import { validateForm, type FormState } from "@/lib/form";
import { forgotSchema, loginSchema, resetSchema, signupSchema, staffSchema } from "@/lib/validation";

const initial: FormState = {};
type Errs = Record<string, string[] | undefined>;

/** Shared wiring: client-side Zod check first, then the server action (which re-validates). */
function useZodAction(action: (s: FormState, fd: FormData) => Promise<FormState>, schema: Parameters<typeof validateForm>[0]) {
  const [state, formAction] = useActionState(action, initial);
  const [clientErrors, setClientErrors] = useState<Errs>({});
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const errs = validateForm(schema, e.currentTarget);
    setClientErrors(errs);
    if (Object.keys(errs).length) e.preventDefault();
  };
  const err = (k: string) => (clientErrors[k] ?? state.fieldErrors?.[k])?.[0];
  return { state, formAction, onSubmit, err };
}

export function LoginForm({ resetOk }: { resetOk?: boolean }) {
  const { state, formAction, onSubmit, err } = useZodAction(loginAction, loginSchema);
  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="space-y-4">
      {resetOk && <Alert tone="green">Password updated. Sign in with your new password.</Alert>}
      {state.error && <Alert>{state.error}</Alert>}
      <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@company.com" error={err("email")} />
      <div>
        <PasswordField label="Password" showRules={false} error={err("password")} />
        <div className="mt-1.5 text-right">
          <Link href="/forgot-password" className="text-xs font-medium text-brand-600 hover:underline">Forgot password?</Link>
        </div>
      </div>
      <SubmitButton>Sign in</SubmitButton>
    </form>
  );
}

export function SignupForm() {
  const { state, formAction, onSubmit, err } = useZodAction(signupAction, signupSchema);
  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      <Field label="Full name" name="name" autoComplete="name" placeholder="Asha Nair" error={err("name")} />
      <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@company.com" error={err("email")} />
      <PasswordField error={err("password")} />
      <Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••••" error={err("confirmPassword")} />
      <SubmitButton>Create account</SubmitButton>
    </form>
  );
}

export function ForgotForm() {
  const { state, formAction, onSubmit, err } = useZodAction(forgotPasswordAction, forgotSchema);
  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="space-y-4">
      {state.success && <Alert tone="green">{state.success}</Alert>}
      {state.devLink && (
        <div className="rounded-lg border border-saffron-100 bg-saffron-50 p-3 text-xs text-saffron-700">
          <p className="font-medium">Demo mode: SMTP isn’t configured, so the link is shown here (and in the server console).</p>
          <Link href={state.devLink} className="mt-1 block break-all font-medium underline">{state.devLink}</Link>
        </div>
      )}
      <Field label="Registered email" name="email" type="email" autoComplete="email" placeholder="you@company.com" error={err("email")} />
      <SubmitButton>Send reset link</SubmitButton>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const { state, formAction, onSubmit, err } = useZodAction(resetPasswordAction, resetSchema);
  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.error && (
        <Alert>
          {state.error} <Link href="/forgot-password" className="font-medium underline">Get a new link</Link>
        </Alert>
      )}
      <PasswordField label="New password" error={err("password")} />
      <Field label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••••" error={err("confirmPassword")} />
      <SubmitButton>Update password</SubmitButton>
    </form>
  );
}

export function StaffForm() {
  const { state, formAction, onSubmit, err } = useZodAction(createStaffAction, staffSchema);
  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="space-y-4" key={state.success ?? "form"}>
      {state.success && <Alert tone="green">{state.success}</Alert>}
      {state.error && <Alert>{state.error}</Alert>}
      <Field label="Full name" name="name" placeholder="Riya Menon" error={err("name")} />
      <Field label="Work email" name="email" type="email" placeholder="riya@brightloop.com" error={err("email")} />
      <PasswordField label="Temporary password" error={err("password")} />
      <SubmitButton>Add staff member</SubmitButton>
    </form>
  );
}
