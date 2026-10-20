import type { Metadata } from "next";
import { DashboardGate } from "@/components/dashboard-gate";
import { getCurrentUser } from "@/lib/auth";
import { getDashboard } from "@/lib/dashboard";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { DashboardPage } from "./dashboard-page";

export const metadata: Metadata = { title: "Dashboard", robots: PRIVATE_ROBOTS };
export const instant = false;

/** Signed in: the feed. Signed out: the sign-in landing, with a reason if Google sign-in just failed. */
export default async function Page(props: PageProps<"/dashboard">) {
  const user = await getCurrentUser();
  if (user) {
    const { profile, courses } = await getDashboard();
    const me = profile
      ? {
          handle: profile.handle,
          displayName: profile.displayName,
          tagline: profile.tagline,
          courseName: courses.find((c) => c.id === profile.courseId)?.name ?? "",
        }
      : null;
    return <DashboardPage email={user.email} me={me} />;
  }
  const { signin } = await props.searchParams;
  return <DashboardGate problem={typeof signin === "string" ? signin : null} />;
}
