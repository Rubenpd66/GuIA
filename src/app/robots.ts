import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // The content banks are data for the app, and /design is an internal reference page.
    rules: { userAgent: "*", allow: "/", disallow: ["/banks/", "/*/design"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
