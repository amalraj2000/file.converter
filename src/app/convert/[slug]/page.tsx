import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Converter } from "@/components/Converter";
import { allSlugs, parseSlug } from "@/lib/formats";

export const dynamicParams = false;
export const generateStaticParams = () => allSlugs().map((slug) => ({ slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pair = parseSlug((await params).slug);
  if (!pair) return {};
  const { source: s, target: t } = pair;
  return {
    title: `${s.label} to ${t.label} Converter`,
    description: `Convert ${s.label} to ${t.label} free, right in your browser. No upload, no signup — your files never leave your device.`,
    alternates: { canonical: `/convert/${s.id}-to-${t.id}` },
  };
}

export default async function ConvertPage({ params }: Props) {
  const pair = parseSlug((await params).slug);
  if (!pair) notFound();
  const { source: s, target: t } = pair;

  const faqs = [
    { q: `Is my ${s.label} file uploaded anywhere?`, a: "No. The conversion runs entirely in your browser using JavaScript and WebAssembly. Your file never leaves your device." },
    { q: `Is there a file size limit for ${s.label} to ${t.label}?`, a: "There's no server limit, but the browser has to hold the file in memory. Very large files (especially video) can be slow or fail on low-memory devices; you'll see a warning first." },
    { q: "Does it work offline?", a: "After the page and (for audio/video) the conversion engine have loaded once, the conversion itself needs no network connection." },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Convert {s.label} to {t.label}</h1>
        <p className="text-muted-foreground">Free and private — runs entirely in your browser.</p>
      </section>
      <Converter defaultTarget={t.id} />
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">How to convert {s.label} to {t.label}</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Drop your {s.label} file(s) into the box above, or click to browse.</li>
          <li>{t.label} is already selected as the output format.</li>
          <li>Click <b>Convert</b>, then download each file or all of them as a ZIP.</li>
        </ol>
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
