import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Converter } from "@/components/Converter";
import { JsonLd } from "@/components/JsonLd";
import { CONVERSIONS, allSlugs, parseSlug, slugFor, targetsFor } from "@/lib/formats";
import { FORMAT_INFO } from "@/lib/format-info";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => allSlugs().map((slug) => ({ slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pair = parseSlug((await params).slug);
  if (!pair) return {};
  const { source: s, target: t } = pair;
  const path = `/convert/${slugFor(s.id, t.id)}`;
  const title = `${s.label} to ${t.label} Converter — Free, Private, No Upload`;
  const bestFor = FORMAT_INFO[t.id]?.bestFor;
  const description = `Convert ${s.label} to ${t.label} free online — private, no upload, runs in your browser.${bestFor ? ` ${t.label} is best for ${bestFor}.` : ""}`;
  return {
    title,
    description,
    keywords: [`${s.label} to ${t.label}`, `convert ${s.label} to ${t.label}`, `${s.id} to ${t.id}`, `${s.label} to ${t.label} online`, "free file converter", "private file converter"],
    alternates: { canonical: path },
    openGraph: { type: "website", title, description, url: absoluteUrl(path), siteName: SITE_NAME },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ConvertPage({ params }: Props) {
  const pair = parseSlug((await params).slug);
  if (!pair) notFound();
  const { source: s, target: t } = pair;
  const si = FORMAT_INFO[s.id];
  const ti = FORMAT_INFO[t.id];
  const path = `/convert/${slugFor(s.id, t.id)}`;

  const otherTargets = targetsFor(s.id).filter((x) => x !== t.id).slice(0, 8);
  const otherSources = Object.entries(CONVERSIONS).filter(([src, tg]) => src !== s.id && tg.includes(t.id)).map(([src]) => src).slice(0, 8);

  const faqs = [
    { q: `How do I convert ${s.label} to ${t.label}?`, a: `Drop your ${s.label} file onto the converter above (or click to browse), make sure ${t.label} is selected, and click Convert. When it finishes, download the ${t.label} file or a ZIP of all your files.` },
    { q: `Is my ${s.label} file uploaded anywhere?`, a: "No. The conversion runs entirely in your browser using JavaScript and WebAssembly. Your file never leaves your device, and nothing is stored." },
    { q: `What is the difference between ${s.label} and ${t.label}?`, a: `${si?.about ?? ""} ${ti?.about ?? ""}`.trim() },
    ...(si?.lossy !== undefined && ti
      ? [{
          q: `Will I lose quality converting ${s.label} to ${t.label}?`,
          a: !ti.lossy
            ? `${t.label} is a lossless format, so converting to it does not add compression loss. Any quality already lost in the ${s.label} file cannot be recovered.`
            : `${t.label} uses lossy compression, so some detail is traded for a smaller file. You can control the quality in Settings before converting.`,
        }]
      : []),
    { q: "Can I convert many files at once?", a: "Yes. Add as many files as you like, convert them in one batch, and download them individually or all together as a ZIP." },
    { q: "Does it work on my phone?", a: "Yes. The converter works in modern mobile browsers. Very large video files may be slow on phones because everything is processed on your device." },
  ];

  const url = absoluteUrl(path);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: `${s.label} to ${t.label} Converter`,
      url,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (runs in the browser)",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: `Free online ${s.label} to ${t.label} converter that runs privately in your browser.`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: `${s.label} to ${t.label}`, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <div className="space-y-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">Home</Link> <span aria-hidden>/</span> <span>{s.label} to {t.label}</span>
      </nav>

      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Convert {s.label} to {t.label}</h1>
        <p className="text-muted-foreground">Free {s.label} to {t.label} converter. Private, fast and runs entirely in your browser — no upload, no signup.</p>
      </section>

      <Converter defaultTarget={t.id} />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">How to convert {s.label} to {t.label}</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Drop your {s.label} file(s) into the box above, or click to browse.</li>
          <li>{t.label} is already selected as the output format. Open Settings to adjust quality or size.</li>
          <li>Click <b>Convert</b>, then download each file or all of them as a ZIP.</li>
        </ol>
      </section>

      {(si || ti) && (
        <section className="grid gap-4 sm:grid-cols-2">
          {si && (
            <article className="rounded-lg border p-4">
              <h2 className="font-semibold">About {s.label}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{si.full}</p>
              <p className="mt-2 text-sm text-muted-foreground">{si.about} Best for {si.bestFor}.</p>
            </article>
          )}
          {ti && (
            <article className="rounded-lg border p-4">
              <h2 className="font-semibold">About {t.label}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{ti.full}</p>
              <p className="mt-2 text-sm text-muted-foreground">{ti.about} Best for {ti.bestFor}.</p>
            </article>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Why convert {s.label} to {t.label}?</h2>
        <p className="text-sm text-muted-foreground">
          Choose {t.label} when you need {ti?.bestFor ?? `${t.label} compatibility`}. {s.label} is usually used for {si?.bestFor ?? "its original purpose"}, so converting
          makes your file work where {t.label} is expected. Because everything runs on your own device, it is also a safe choice for private or sensitive files.
        </p>
      </section>

      {(otherTargets.length > 0 || otherSources.length > 0) && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Related converters</h2>
          {otherTargets.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Convert {s.label} to other formats</h3>
              <ul className="flex flex-wrap gap-2">
                {otherTargets.map((x) => (
                  <li key={x}><Link href={`/convert/${slugFor(s.id, x)}`} className="rounded-full border px-3 py-1 text-sm hover:bg-muted">{s.label} to {x.toUpperCase()}</Link></li>
                ))}
              </ul>
            </div>
          )}
          {otherSources.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Convert other formats to {t.label}</h3>
              <ul className="flex flex-wrap gap-2">
                {otherSources.map((x) => (
                  <li key={x}><Link href={`/convert/${slugFor(x, t.id)}`} className="rounded-full border px-3 py-1 text-sm hover:bg-muted">{x.toUpperCase()} to {t.label}</Link></li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Frequently asked questions</h2>
        {faqs.map((f) => (
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
