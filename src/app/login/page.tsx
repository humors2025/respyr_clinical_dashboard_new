import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in · Respyr" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Only accept same-site relative paths — never redirect to an absolute URL
  // supplied through the query string.
  const nextPath = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center bg-page p-5">
      <div className="w-full max-w-[420px]">
        <div className="animate-modal-in overflow-hidden rounded-card border border-line bg-card shadow-[0_20px_60px_rgba(37,37,37,0.18),0_6px_16px_rgba(37,37,37,0.08),0_1px_3px_rgba(37,37,37,0.05)]">
          <div className="flex flex-col items-center px-8 pt-9 pb-2">
            <BrandMark size={52} />
            <h1 className="type-page-title mt-4 text-ink">Respyr Clinic Portal</h1>
            <p className="type-small mt-1.5 text-center text-ink-3">
              Sign in to review patient screening results.
            </p>
          </div>

          <div className="px-8 pt-6 pb-8">
            <LoginForm nextPath={nextPath} />
          </div>
        </div>

        <p className="type-micro mt-5 text-center text-ink-4">
          Respyr is a CDSCO-approved Class-B IVD screening device.
          <br />
          Results support clinical judgement — they do not replace it.
        </p>
      </div>
    </main>
  );
}
