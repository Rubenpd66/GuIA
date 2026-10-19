import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";
import { getContent } from "@/lib/content/load";
import { EXAM_PARTS } from "@/lib/exam/format";
import { sitemapEntries } from "@/lib/seo/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await getContent();
  return sitemapEntries(SITE.url, {
    "/grammar/[slug]": content.grammarLessons.map((lesson) => lesson.slug),
    "/vocabulary/[slug]": content.vocabularyGroups.map((group) => group.slug),
    "/practice/[part]": EXAM_PARTS,
  });
}
