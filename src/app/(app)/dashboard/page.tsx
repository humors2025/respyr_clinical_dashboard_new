import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { todayInClinicTz } from "@/lib/scores";
import { getSession } from "@/lib/session";
import { DashboardView } from "./dashboard-view";

export const metadata: Metadata = { title: "Dashboard · Respyr" };

// Clinic data is per-request and must never be cached across sessions.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await getDashboardData(
    session.loginId,
    session.username,
    todayInClinicTz(),
  );

  return <DashboardView initialData={data} />;
}
