import type { MetadataRoute } from "next";
import { COMPRESS_KINDS } from "@/lib/compress-kinds";
import { allSlugs } from "@/lib/formats";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: siteUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/compress`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    ...COMPRESS_KINDS.map((k) => ({ url: `${siteUrl}/compress/${k.slug}`, lastModified, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...allSlugs().map((s) => ({ url: `${siteUrl}/convert/${s}`, lastModified, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
