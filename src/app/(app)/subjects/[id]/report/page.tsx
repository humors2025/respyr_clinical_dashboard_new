import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getReportData } from "@/lib/report";
import { getSession } from "@/lib/session";
import { ReportActions } from "./report-actions";
import { ReportDocument } from "./report-document";

export const metadata: Metadata = { title: "Health report · Respyr" };
export const dynamic = "force-dynamic";

/** `REPORT_<name>_<DD_MON_YYYY_HH_MM>` — mirrors the legacy download filename. */
function fileStem(name: string, iso: string | null): string {
  const safe = (name || "unknown").replace(/[^a-z0-9_-]/gi, "_");
  if (!iso) return `REPORT_${safe}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return `REPORT_${safe}`;
  const p = (n: number) => String(n).padStart(2, "0");
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `REPORT_${safe}_${p(d.getDate())}_${months[d.getMonth()]}_${d.getFullYear()}_${p(d.getHours())}_${p(d.getMinutes())}`;
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const { t } = await searchParams;
  const profileId = decodeURIComponent(id);

  // Only the subject id and the test timestamp travel in the URL; every value
  // on the report is fetched server-side against the session's clinic.
  const data = await getReportData(session.loginId, profileId, t ?? "");

  if (!data.test) {
    return (
      <div className="mx-auto max-w-[560px] py-16 text-center">
        <h1 className="type-page-title text-ink">No test found</h1>
        <p className="type-small mt-2 text-ink-3">
          This subject has no recorded test to report on.
        </p>
        <Link href={`/subjects/${encodeURIComponent(profileId)}`} className="btn-primary mt-6 inline-flex px-6">
          Back to profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/subjects/${encodeURIComponent(profileId)}`}
          className="type-small inline-flex items-center gap-1.5 text-ink-3 transition-colors hover:text-blue"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to {data.subject.name}
        </Link>
        <ReportActions
          patientName={data.subject.name}
          fileStem={fileStem(data.subject.name, data.test.takenAt)}
        />
      </div>

      <ReportDocument data={data} />
    </div>
  );
}
