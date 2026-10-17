import type { Metadata } from "next";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { DashboardPage } from "./dashboard-page";

export const metadata: Metadata = { title: "Dashboard", robots: PRIVATE_ROBOTS };

export default function Page() {
  return <DashboardPage />;
}
