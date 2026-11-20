import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Converter } from "@/components/Converter";
import { JsonLd } from "@/components/JsonLd";
import { COMPRESS_KINDS, getKind } from "@/lib/compress-kinds";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => COMPRESS_KINDS.map((k) => ({ kind: k.slug }));

type Props = { params: Promise<{ kind: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const k = getKind((await params).kind);
  if (!k) return {};
  return {
    title: `${k.title} — reduce file size online`,
    description: `${k.blurb} Free and private: files are compressed in your browser and never uploaded.`,
    alternates: { canonical: `/compress/${k.slug}` },
    openGraph: { type: "website", title: `${k.title} — reduce file size online`, description: k.blurb, url: absoluteUrl(`/compress/${k.slug}`), siteName: SITE_NAME },
  };
}

export default async function CompressKindPage({ params }: Props) {
  const k = getKind((await params).kind);
  if (!k) notFound();

  const faqs = [
    { q: "Are my files uploaded?", a: "No. Compression runs entirely in your browser, so your files never leave your device." },
    { q: "How much smaller will my file get?", a: "It depends on the file and the level you pick (Light, Balanced or Strong). If a file can't be made smaller, the original is returned unchanged so you never get a bigger file." },
    { q: "Will quality suffer?", a: "Light keeps quality high, Strong trades some quality for the smallest size. Change the level in Settings and compare the before and after sizes." },
  ];
  const url = absoluteUrl(`/compress/${k.slug}`);
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "WebApplication", name: k.title, url, applicationCategory: "UtilitiesApplication", operatingSystem: "Any (runs in the browser)", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: k.blurb },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "File size reducer", item: absoluteUrl("/compress") },
      { "@type": "ListItem", position: 3, name: k.title, item: url },
    ] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];

  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">{k.h1}</h1>
        <p className="text-muted-foreground">{k.blurb} Free, private, no upload.</p>
      </section>
      <Converter mode="compress" />
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">How it works</h2>
        <p className="text-sm text-muted-foreground">{k.how}</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">FAQ</h2>
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
