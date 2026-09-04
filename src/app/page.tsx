import { redirect } from "next/navigation";

export default function RootPage() {
  // Middleware bounces unauthenticated visitors to /login.
  redirect("/dashboard");
}
