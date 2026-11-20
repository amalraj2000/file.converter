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

## Deploy on Vercel

Import the repo in Vercel (framework preset: Next.js). No environment variables are required;
optionally set `NEXT_PUBLIC_SITE_URL` to your production URL for the sitemap and canonical metadata.
`vercel.json` / `next.config.ts` set the COOP/COEP headers needed for SharedArrayBuffer.
