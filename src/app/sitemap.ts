import type { MetadataRoute } from "next";
import { allSlugs } from "@/lib/formats";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [{ url: base }, ...allSlugs().map((s) => ({ url: `${base}/convert/${s}` }))];
}
