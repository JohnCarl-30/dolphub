import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardGate } from "@/components/dashboard-gate";
import { getCurrentUser } from "@/lib/auth";
import { getDashboard } from "@/lib/dashboard";
import { safeNextPath } from "@/lib/next-path";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { DashboardPage } from "./dashboard-page";

export const metadata: Metadata = { title: "Dashboard", robots: PRIVATE_ROBOTS };
export const instant = false;

/** Signed in: the student's page, next steps and open opportunities. Signed out: the sign-in landing, with a reason if Google sign-in just failed. */
export default async function Page(props: PageProps<"/dashboard">) {
  const user = await getCurrentUser();
  const { signin, next: rawNext } = await props.searchParams;
  const next = safeNextPath(rawNext);
  if (user) {
    // Already signed in, so go straight to the page sign-in was meant to return to.
    if (next) redirect(next);
    const { profile, courses, projects, imageCount } = await getDashboard();
    const me = profile
      ? {
          handle: profile.handle,
          displayName: profile.displayName,
          tagline: profile.tagline,
          courseName: courses.find((c) => c.id === profile.courseId)?.name ?? "",
          projectCount: projects.length,
          photoCount: imageCount,
          profilePictureUrl: profile.profilePicture?.url ?? null,
        }
      : null;
    return <DashboardPage email={user.email} me={me} />;
  }
  return <DashboardGate problem={typeof signin === "string" ? signin : null} next={next} />;
}
