# LocalConvert

Privacy-first universal file converter. All conversions run in your browser — nothing is uploaded.

- Images (JPG, PNG, WEBP, AVIF, BMP, ICO), video/audio (ffmpeg.wasm), documents, spreadsheets and text
- Next.js (App Router), TypeScript, Tailwind CSS
- `/convert/[slug]` SEO pages, batch queue, ZIP export, settings drawer, dark/light mode

## Develop

```bash
npm install     # postinstall copies the ffmpeg core into public/ffmpeg
npm run dev
```

## Features

- Convert 110+ format pairs (images, video, audio, PDF, Word, Excel, CSV, JSON, Markdown, text)
- File size reducer at `/compress` for images, video, audio, PDF, Office files and any other file
- Batch queue, ZIP export, settings drawer, dark/light mode, responsive layout

## Deploy on Vercel

Import the repo in Vercel (framework preset: Next.js). No environment variables are required;
optionally set `NEXT_PUBLIC_SITE_URL` to your production URL for the sitemap and canonical metadata.
`vercel.json` / `next.config.ts` set the COOP/COEP headers needed for SharedArrayBuffer.

## SEO

Pages ship with unique titles/descriptions, canonical URLs, Open Graph/Twitter cards, JSON-LD (WebApplication,
FAQPage, BreadcrumbList), `robots.txt`, `sitemap.xml` and a generated share image.

| Env var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Your production origin, e.g. `https://example.com`. Falls back to Vercel's production domain. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Token from Google Search Console (HTML tag method). |

After deploying: add the site in Google Search Console, then submit `https://<your-domain>/sitemap.xml`.
