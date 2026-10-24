import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOpenOpportunityPreviews } from "@/lib/opportunities";
import { getShowcase } from "@/lib/profiles";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { HomePage } from "../home-page";

export const metadata: Metadata = { title: "Home", robots: PRIVATE_ROBOTS };
export const instant = false;

/** The student showcase is available only after sign-in. */
export default async function Page() {
  if (!(await getCurrentUser())) redirect("/dashboard?next=/home");
  return <HomePage showcase={getShowcase()} opportunities={getOpenOpportunityPreviews()} />;
}
