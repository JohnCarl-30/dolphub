import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/*
 * Login and sample profiles stay crawlable on purpose: a crawler blocked here
 * would never see their noindex tag. `/home` deliberately remains crawlable
 * so its page-level noindex metadata can be read.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/profile", "/admin", "/auth/", "/api/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
