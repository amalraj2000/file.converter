import Link from "next/link";
import { Converter } from "@/components/Converter";

const POPULAR = ["jpg-to-png", "png-to-webp", "mp4-to-mp3", "mov-to-mp4", "csv-to-xlsx", "xlsx-to-json", "md-to-pdf", "docx-to-pdf", "png-to-pdf"];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Convert any file. Privately.</h1>
        <p className="text-muted-foreground">Everything runs in your browser — nothing is uploaded, nothing is stored.</p>
      </section>
      <Converter />
      <section>
        <h2 className="mb-3 text-lg font-semibold">Popular conversions</h2>
        <ul className="flex flex-wrap gap-2">
          {POPULAR.map((s) => (
            <li key={s}><Link href={`/convert/${s}`} className="rounded-full border px-3 py-1 text-sm hover:bg-muted">{s.replace("-to-", " → ").toUpperCase()}</Link></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
