import type { Metadata } from "next";
import { DashboardGate } from "@/components/dashboard-gate";
import { getCurrentUser } from "@/lib/auth";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { DashboardPage } from "./dashboard-page";

export const metadata: Metadata = { title: "Dashboard", robots: PRIVATE_ROBOTS };
export const instant = false;

/** Signed in: the feed. Signed out: the sign-in landing, with a reason if Google sign-in just failed. */
export default async function Page(props: PageProps<"/dashboard">) {
  const user = await getCurrentUser();
  if (user) return <DashboardPage email={user.email} />;
  const { signin } = await props.searchParams;
  return <DashboardGate problem={typeof signin === "string" ? signin : null} />;
}
