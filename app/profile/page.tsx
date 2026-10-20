import type { Metadata } from "next";
import { getDashboard } from "@/lib/dashboard";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { CreateProfileForm } from "./create-profile-form";
import { ProfileEditor } from "./profile-editor";

export const metadata: Metadata = { title: "Profile", robots: PRIVATE_ROBOTS };
export const instant = false;

/** Signed out goes to /login. No profile yet: the create form. Otherwise: the editor. */
export default async function Page() {
  const dashboard = await getDashboard();
  if (!dashboard.profile) return <CreateProfileForm courses={dashboard.courses} />;
  return <ProfileEditor dashboard={{ ...dashboard, profile: dashboard.profile }} />;
}
