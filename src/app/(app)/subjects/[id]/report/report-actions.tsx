"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

/**
 * Download / email controls for the report.
 *
 * The PDF is rasterised in the browser with html2canvas + jsPDF, the same
 * approach the legacy portal used — it is what lets us hand an actual file to
 * the mailer. Both libraries are imported lazily so a clinician who only reads
 * the report on screen never downloads ~250 KB of PDF tooling.
 */
export function ReportActions({
  patientName,
  fileStem,
}: {
  patientName: string;
  fileStem: string;
}) {
  const [busy, setBusy] = useState<null | "download" | "prepare" | "send">(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const pdfBlob = useRef<Blob | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  async function buildPdf(scale: number): Promise<Blob> {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf").then((m) => ({ default: m.jsPDF })),
      import("html2canvas"),
    ]);

    const pdf = new jsPDF("p", "mm", "a4");
    const pages = Array.from(document.querySelectorAll<HTMLElement>(".report-page"));

    // Charts and the clinic logo must be painted before rasterising, or they
    // land in the PDF as blank boxes.
    await Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise<void>((resolve) => {
              img.onload = img.onerror = () => resolve();
            }),
        ),
    );

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
        scale,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollY: -window.scrollY,
      });
      const img = canvas.toDataURL("image/jpeg", 0.92);
      const w = pdf.internal.pageSize.getWidth();
      const props = pdf.getImageProperties(img);
      const h = (props.height * w) / props.width;
      if (i > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 0, w, h);
    }
    return pdf.output("blob");
  }

  async function handleDownload() {
    if (busy) return;
    setBusy("download");
    setError(null);
    try {
      const blob = await buildPdf(3);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileStem}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[report] pdf generation failed", err);
      setError("Could not generate the PDF. Try again, or use your browser's print to PDF.");
    } finally {
      setBusy(null);
    }
  }

  async function openEmailModal() {
    if (busy) return;
    setBusy("prepare");
    setError(null);
    try {
      // Lower scale here: this one gets attached to an email, and a 4x raster
      // of eight pages comfortably exceeds most inbox attachment limits.
      pdfBlob.current = await buildPdf(1.5);
      setModalOpen(true);
    } catch (err) {
      console.error("[report] pdf generation failed", err);
      setError("Could not prepare the PDF for sending.");
    } finally {
      setBusy(null);
    }
  }

  async function sendEmail(event: FormEvent) {
    event.preventDefault();
    if (busy || !pdfBlob.current) return;
    setBusy("send");
    setError(null);

    const form = new FormData();
    form.append("email", email.trim());
    form.append("name", patientName);
    form.append("pdf", new File([pdfBlob.current], "Health_Report.pdf", { type: "application/pdf" }));

    try {
      const res = await fetch("/api/report/email", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Could not send the report.");
        setBusy(null);
        return;
      }
      setModalOpen(false);
      setEmail("");
      setToast(data?.message ?? "Report sent.");
    } catch {
      setError("Cannot reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <button type="button" onClick={handleDownload} disabled={busy !== null} className="btn-primary px-5">
          {busy === "download" ? (
            <>
              <Spinner />
              Generating…
            </>
          ) : (
            <>
              <DownloadIcon />
              Download PDF
            </>
          )}
        </button>
        <button type="button" onClick={openEmailModal} disabled={busy !== null} className="btn-ghost h-11 px-5">
          {busy === "prepare" ? (
            <>
              <Spinner dark />
              Preparing…
            </>
          ) : (
            <>
              <MailIcon />
              Send by email
            </>
          )}
        </button>
      </div>

      {error && !modalOpen && (
        <p role="alert" className="type-small mt-2 rounded-input border border-red/25 bg-red-light px-3.5 py-2 text-red print:hidden">
          {error}
        </p>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(37,37,37,0.35)] p-5 backdrop-blur-[3px] print:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-report-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && busy === null) setModalOpen(false);
          }}
        >
          <form
            onSubmit={sendEmail}
            className="animate-modal-in w-full min-w-0 max-w-[420px] overflow-hidden rounded-card border border-line bg-card shadow-[0_20px_60px_rgba(37,37,37,0.18)]"
          >
            <div className="border-b border-line px-6 py-5">
              <h2 id="email-report-title" className="type-section text-ink">
                Send report
              </h2>
              <p className="type-small mt-0.5 text-ink-3">
                The PDF for {patientName} will be attached.
              </p>
            </div>

            <div className="px-6 py-5">
              <label htmlFor="report-email" className="type-label mb-1.5 block text-ink-2">
                Recipient email
              </label>
              <input
                id="report-email"
                type="email"
                required
                autoFocus
                disabled={busy === "send"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(error)}
                placeholder="name@example.com"
                className="field-input"
              />
              {error && (
                <p role="alert" className="type-micro mt-1.5 font-normal text-red">
                  {error}
                </p>
              )}
              <p className="type-micro mt-3 font-normal text-ink-4">
                This sends a patient health report. Check the address before sending.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={busy === "send"}
                className="btn-ghost h-11 px-5"
              >
                Cancel
              </button>
              <button type="submit" disabled={busy === "send" || !email.trim()} className="btn-primary px-6">
                {busy === "send" ? (
                  <>
                    <Spinner />
                    Sending…
                  </>
                ) : (
                  "Send report"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="animate-modal-in fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-input border border-green/25 bg-green-light px-4 py-3 shadow-[0_12px_32px_rgba(37,37,37,0.14)] print:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
          <span className="type-small text-green">{toast}</span>
        </div>
      )}
    </>
  );
}

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <svg className="animate-spin-slow" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={dark ? "var(--color-line)" : "rgba(255,255,255,0.3)"} strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke={dark ? "var(--color-blue)" : "#fff"} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4 20h16" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
