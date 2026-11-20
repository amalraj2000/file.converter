export const SITE_NAME = "LocalConvert";
export const COMPANY_NAME = "softDestiny";
export const COMPANY_TAGLINE = "Innovative Software Solutions";
export const COMPANY_URL = "https://softdestiny.vercel.app/";
export const SITE_TAGLINE = "Free private file converter & compressor";

/**
 * Canonical origin used for sitemap, canonicals and Open Graph.
 * Priority: explicit NEXT_PUBLIC_SITE_URL → Vercel's production domain (auto-set) → localhost.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

export const absoluteUrl = (path = "/") => `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
