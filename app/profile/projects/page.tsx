import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDashboard } from "@/lib/dashboard";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { ProjectsEditor } from "./projects-editor";

export const metadata: Metadata = { title: "Projects", robots: PRIVATE_ROBOTS };
export const instant = false;

/** Signed out goes to /login. Students without a profile return to profile creation. */
export default async function Page() {
  const dashboard = await getDashboard();
  if (!dashboard.profile) redirect("/profile");
  return <ProjectsEditor dashboard={{ ...dashboard, profile: dashboard.profile }} />;
}
