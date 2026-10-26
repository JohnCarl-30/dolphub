import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOpenOpportunityPreviews } from "@/lib/opportunities";
import { getShowcase } from "@/lib/profiles";
import { getServiceContext } from "@/lib/server";
import { getNewsletterSubscription } from "@/lib/services/newsletter";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { HomePage } from "../home-page";

export const metadata: Metadata = { title: "Home", robots: PRIVATE_ROBOTS };
export const instant = false;

/** The student showcase is available only after sign-in. */
export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard?next=/home");
  const subscription = await getNewsletterSubscription((await getServiceContext()).db, user.id);
  return (
    <HomePage showcase={getShowcase()} opportunities={getOpenOpportunityPreviews()} subscription={subscription} />
  );
}
