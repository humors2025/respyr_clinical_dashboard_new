import { NextResponse } from "next/server";
import { requireSession, UnauthorizedError } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Emails a generated report PDF, by proxying to the existing PHP mailer.
 *
 * Proxied rather than posted straight from the browser so that the sending
 * clinic is taken from the session cookie instead of a form field — otherwise
 * anyone could send mail branded as any clinic.
 */
const MAILER_URL =
  process.env.RESPYR_MAILER_URL ??
  "https://portal.respyr.in/clinical-dashboard_v2/report/send_email1.php";

const MAX_PDF_BYTES = 12 * 1024 * 1024;
// Deliberately permissive — matching the mailer's own tolerance is pointless,
// this only rejects obvious nonsense before spending an upstream round trip.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  try {
    const session = await requireSession();

    const form = await request.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: "Malformed request." }, { status: 400 });
    }

    const email = String(form.get("email") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();
    const pdf = form.get("pdf");

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!(pdf instanceof File) || pdf.size === 0) {
      return NextResponse.json({ error: "The report PDF was not attached." }, { status: 400 });
    }
    if (pdf.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: "The generated PDF is too large to email." },
        { status: 413 },
      );
    }

    const upstream = new FormData();
    upstream.append("email", email);
    upstream.append("name", name);
    // Branding comes from the session, never the client.
    upstream.append("brand_name", session.loginId);
    upstream.append("pdf", pdf, "Health_Report.pdf");

    const res = await fetch(MAILER_URL, { method: "POST", body: upstream });
    const text = await res.text();

    let data: { success?: boolean; message?: string } | null = null;
    try {
      data = JSON.parse(text.slice(text.search(/[[{]/)));
    } catch {
      /* fall through to the generic failure below */
    }

    if (!res.ok || !data?.success) {
      console.error(`[api/report/email] mailer rejected: ${text.slice(0, 300)}`);
      return NextResponse.json(
        { error: data?.message ?? "The report could not be sent. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, message: data.message ?? "Report sent." });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    console.error("[api/report/email] failed", err);
    return NextResponse.json({ error: "Could not send the report." }, { status: 500 });
  }
}
