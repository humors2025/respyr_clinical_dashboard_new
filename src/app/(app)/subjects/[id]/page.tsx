import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfileData } from "@/lib/profile";
import { getSession } from "@/lib/session";
import { ProfileView } from "./profile-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `${decodeURIComponent(id)} · Respyr` };
}

export default async function SubjectProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const { name } = await searchParams;
  const profileId = decodeURIComponent(id);

  // `name` is only a display fallback for the moment before the profile
  // endpoint answers; every figure on the page comes from the server fetch,
  // scoped to the session's clinic.
  const data = await getProfileData(session.loginId, profileId, name ?? profileId);

  return <ProfileView data={data} />;
}
