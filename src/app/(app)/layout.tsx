import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { fetchClinicLogo } from "@/lib/respyr-api";
import { getSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // Middleware already redirects, but a layout must never render clinic
  // chrome without a verified session.
  if (!session) redirect("/login");

  const logo = await fetchClinicLogo(session.loginId).catch(() => null);

  return (
    <AppShell username={session.username} logo={logo}>
      {children}
    </AppShell>
  );
}
