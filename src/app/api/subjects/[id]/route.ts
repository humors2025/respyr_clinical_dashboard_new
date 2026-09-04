import { NextResponse } from "next/server";
import { RespyrApiError, updateSubject } from "@/lib/respyr-api";
import { validateMeasurement, type MeasurementField } from "@/lib/subjects";
import { requireSession, UnauthorizedError } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIELDS: MeasurementField[] = ["age", "height", "weight"];

/**
 * Updates one subject's measurements.
 *
 * `login_id` comes from the session cookie, never the request body, so a caller
 * cannot edit a subject belonging to another clinic. Values are validated here
 * rather than only in the form — height and weight feed the BMI and BMR printed
 * on the clinical report, so a bad value produces confidently wrong output.
 */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;

    const profileId = decodeURIComponent(id ?? "").trim();
    if (!profileId) {
      return NextResponse.json({ error: "Missing subject id." }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Malformed request." }, { status: 400 });
    }

    const errors: Record<string, string> = {};
    for (const field of FIELDS) {
      const message = validateMeasurement(field, body[field]);
      if (message) errors[field] = message;
    }
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Please correct the highlighted fields.", errors }, { status: 400 });
    }

    const result = await updateSubject(session.loginId, profileId, {
      age: Number(body.age),
      height: Number(body.height),
      weight: Number(body.weight),
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 422 });
    }
    return NextResponse.json({ ok: true, message: result.message });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    if (err instanceof RespyrApiError) {
      console.error(`[api/subjects] upstream failure: ${err.message} (${err.endpoint})`);
      return NextResponse.json(
        { error: "The profile service is unavailable. Please try again shortly." },
        { status: 503 },
      );
    }
    console.error("[api/subjects] failed", err);
    return NextResponse.json({ error: "Could not update the subject." }, { status: 500 });
  }
}
