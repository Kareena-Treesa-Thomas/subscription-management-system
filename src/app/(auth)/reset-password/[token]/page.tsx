import { ResetForm } from "@/components/auth-forms";

export const metadata = { title: "Choose a new password — Brightloop" };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Choose a new password</h1>
      <p className="mb-6 mt-1.5 text-sm text-ink-soft">Pick something you haven’t used before.</p>
      <ResetForm token={token} />
    </>
  );
}
