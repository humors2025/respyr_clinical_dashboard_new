import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getHistoryData } from "@/lib/history";
import { getSession } from "@/lib/session";
import { HistoryView } from "./history-view";

export const metadata: Metadata = { title: "Test history · Respyr" };

// Clinic data is per-request and must never be cached across sessions.
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await getHistoryData(session.loginId);
  return <HistoryView data={data} />;
}
