import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { fetchSubjects } from "@/lib/respyr-api";
import { normalizeSubject, type Subject } from "@/lib/subjects";
import { getSession } from "@/lib/session";
import { SubjectsView } from "./subjects-view";

export const metadata: Metadata = { title: "Subjects · Respyr" };

// Clinic data is per-request and must never be cached across sessions.
export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let subjects: Subject[] = [];
  let error: string | null = null;
  try {
    subjects = (await fetchSubjects(session.loginId)).map(normalizeSubject);
  } catch (err) {
    console.error("[subjects] fetch failed:", err);
    error = "Could not load subjects. Please try again shortly.";
  }

  return <SubjectsView subjects={subjects} error={error} />;
}
