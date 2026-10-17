import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/*
 * Login and sample profiles stay crawlable on purpose: a crawler blocked here
 * would never see their noindex tag. Only private areas are blocked.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/auth/", "/api/"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
