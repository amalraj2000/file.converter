import Link from "next/link";
import { Lock } from "lucide-react";
import { COMPANY_NAME, COMPANY_TAGLINE, COMPANY_URL } from "@/lib/site";

const COLUMNS: { title: string; links: string[] }[] = [
  { title: "Images", links: ["jpg-to-png", "png-to-jpg", "png-to-webp", "webp-to-png", "jpg-to-pdf"] },
  { title: "Video & audio", links: ["mp4-to-mp3", "mov-to-mp4", "mp4-to-gif", "wav-to-mp3", "mp4-to-webm"] },
  { title: "Spreadsheets & data", links: ["csv-to-xlsx", "xlsx-to-csv", "csv-to-json", "json-to-csv", "xlsx-to-json"] },
  { title: "Documents", links: ["md-to-pdf", "docx-to-pdf", "docx-to-txt", "txt-to-pdf", "md-to-html"] },
];

const COMPRESS_LINKS = [
  { href: "/compress/image", label: "Compress images" },
  { href: "/compress/video", label: "Compress video" },
  { href: "/compress/pdf", label: "Compress PDF" },
  { href: "/compress/audio", label: "Compress audio" },
  { href: "/compress", label: "All file types" },
];

const label = (slug: string) => slug.replace("-to-", " → ").toUpperCase();

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
          <div className="col-span-2 space-y-3 lg:col-span-1">
            <p className="font-semibold">LocalConvert</p>
            <p className="text-sm text-muted-foreground">
              Free file converter that runs entirely in your browser. No uploads, no accounts.
            </p>
          </div>
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="mb-3 text-sm font-semibold">{c.title}</h2>
              <ul className="space-y-2">
                {c.links.map((s) => (
                  <li key={s}>
                    <Link href={`/convert/${s}`} className="text-sm text-muted-foreground hover:text-foreground">
                      {label(s)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <nav aria-label="File size reducer">
            <h2 className="mb-3 text-sm font-semibold">File size reducer</h2>
            <ul className="space-y-2">
              {COMPRESS_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground">{l.label}</Link></li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-success" aria-hidden /> Your files are processed on your device and never uploaded.
          </p>
          <p>
            © {new Date().getFullYear()} LocalConvert · A product of{" "}
            <a href={COMPANY_URL} target="_blank" rel="noopener" className="font-medium text-foreground hover:underline" title={COMPANY_TAGLINE}>
              {COMPANY_NAME}
            </a>{" "}
            — {COMPANY_TAGLINE}
          </p>
        </div>
      </div>
    </footer>
  );
}
