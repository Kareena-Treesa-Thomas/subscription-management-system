"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="panel mx-auto mt-16 max-w-lg p-8">
      <h1 className="text-lg font-semibold">This page couldn&rsquo;t load</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Check that the database is running (<code>docker compose up -d</code>) and that <code>.env</code> points to it.
        After a schema change, run <code>npx prisma migrate dev</code>. If you opened this as a customer, this area is for
        admin and staff only.
      </p>
      <button className="btn-primary mt-5" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
