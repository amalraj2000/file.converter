import type { Metadata } from "next";
import Link from "next/link";
import { Converter } from "@/components/Converter";
import { COMPRESS_KINDS } from "@/lib/compress-kinds";

export const metadata: Metadata = {
  title: "File Size Reducer — compress images, video, audio, PDF and more",
  description: "Reduce the size of any file for free, privately in your browser. Compress images, videos, audio, PDFs, Word and Excel files without uploading them.",
  alternates: { canonical: "/compress" },
};

export default function CompressHome() {
  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Reduce file size. Privately.</h1>
        <p className="text-muted-foreground">Compress images, video, audio, PDFs, Office documents and any other file — right in your browser. Nothing is uploaded.</p>
      </section>
      <Converter mode="compress" />
      <section>
        <h2 className="mb-3 text-lg font-semibold">Compress by file type</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {COMPRESS_KINDS.map((k) => (
            <li key={k.slug}>
              <Link href={`/compress/${k.slug}`} className="block rounded-lg border p-3 hover:bg-muted">
                <span className="block font-medium">{k.title}</span>
                <span className="text-sm text-muted-foreground">{k.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
