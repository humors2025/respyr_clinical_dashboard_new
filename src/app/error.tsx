"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-page p-5">
      <div className="panel w-full max-w-[420px] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-light">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 8v5M12 16.5h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <h1 className="type-page-title mt-4 text-ink">Something went wrong</h1>
        <p className="type-small mt-2 text-ink-3">
          The page could not be loaded. If this keeps happening, contact Humorstech support.
        </p>
        {error.digest && (
          <p className="type-micro mt-3 font-normal text-ink-4">Reference: {error.digest}</p>
        )}
        <button type="button" onClick={reset} className="btn-primary mt-6 w-full">
          Try again
        </button>
      </div>
    </main>
  );
}
