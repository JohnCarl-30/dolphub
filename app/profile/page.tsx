import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { ProfileEditor } from "./profile-editor";

export const metadata: Metadata = { title: "Profile", robots: PRIVATE_ROBOTS };
export const instant = false;

export default async function Page() {
  await requireUser();
  return <ProfileEditor />;
}
