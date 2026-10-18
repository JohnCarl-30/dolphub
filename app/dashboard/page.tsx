import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { DashboardPage } from "./dashboard-page";

export const metadata: Metadata = { title: "Dashboard", robots: PRIVATE_ROBOTS };
export const instant = false;

export default async function Page() {
  const user = await requireUser();
  return <DashboardPage email={user.email} />;
}
