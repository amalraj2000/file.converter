import type { Metadata } from "next";
import Link from "next/link";
import { Converter } from "@/components/Converter";
import { JsonLd } from "@/components/JsonLd";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "LocalConvert — Free Private File Converter & Compressor (No Upload)" },
  description:
    "Convert and compress images, video, audio, PDF, Word, Excel and more for free. Everything runs in your browser — your files are never uploaded.",
  alternates: { canonical: "/" },
};

const POPULAR = ["jpg-to-png", "png-to-jpg", "png-to-webp", "webp-to-png", "mp4-to-mp3", "mov-to-mp4", "mp4-to-gif", "csv-to-xlsx", "xlsx-to-csv", "csv-to-json", "md-to-pdf", "docx-to-pdf", "png-to-pdf", "jpg-to-pdf"];

const FEATURES = [
  { h: "100% private", p: "Files are converted on your device with JavaScript and WebAssembly. Nothing is uploaded to a server." },
  { h: "Works with everything", p: "Images, video, audio, PDF, Word, Excel, CSV, JSON, Markdown and text — over 110 conversions." },
  { h: "Batch & ZIP", p: "Convert many files at once and download them all as a single ZIP." },
  { h: "File size reducer", p: "Shrink images, video, audio, PDFs and Office files, with before-and-after sizes." },
];

const FAQS = [
  { q: "Is LocalConvert really free and private?", a: "Yes. It is free to use with no signup, and conversion happens entirely in your browser, so your files never leave your device." },
  { q: "Which file formats can I convert?", a: "Images (JPG, PNG, WEBP, AVIF, BMP, ICO, GIF), video (MP4, WEBM, MOV, AVI, MKV), audio (MP3, WAV, AAC, OGG, M4A, FLAC), and documents or data (PDF, DOCX, XLSX, CSV, JSON, Markdown, TXT)." },
  { q: "Is there a file size limit?", a: "There is no server limit, but your browser must hold the file in memory. Large videos can be slow on low-memory devices, and you will see a warning before converting." },
  { q: "Can I reduce the size of a file?", a: "Yes. Use the File size reducer to compress images, video, audio, PDFs, Word and Excel files, or pack any other file into a ZIP." },
];

export default function Home() {
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: SITE_NAME,
      url: absoluteUrl("/"),
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (runs in the browser)",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: "Free private file converter and compressor that runs in your browser.",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <div className="space-y-12">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Free file converter &amp; compressor that never uploads your files</h1>
        <p className="text-muted-foreground">Convert images, video, audio, PDFs, documents and spreadsheets — everything runs in your browser, nothing is stored.</p>
      </section>

      <Converter />

      <section>
        <h2 className="mb-3 text-lg font-semibold">Popular conversions</h2>
        <ul className="flex flex-wrap gap-2">
          {POPULAR.map((s) => (
            <li key={s}><Link href={`/convert/${s}`} className="rounded-full border px-3 py-1 text-sm hover:bg-muted">{s.replace("-to-", " → ").toUpperCase()}</Link></li>
          ))}
          <li><Link href="/compress" className="rounded-full border border-primary px-3 py-1 text-sm text-primary hover:bg-muted">Reduce file size →</Link></li>
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <article key={f.h} className="rounded-lg border p-4">
            <h2 className="font-semibold">{f.h}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{f.p}</p>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Frequently asked questions</h2>
        {FAQS.map((f) => (
          <details key={f.q} className="rounded-md border p-3">
            <summary className="cursor-pointer font-medium">{f.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </section>

      <JsonLd data={jsonLd} />
    </div>
  );
}
