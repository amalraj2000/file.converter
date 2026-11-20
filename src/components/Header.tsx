import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/convert/jpg-to-png", label: "Images" },
  { href: "/convert/mp4-to-mp3", label: "Video & audio" },
  { href: "/convert/csv-to-xlsx", label: "Spreadsheets" },
  { href: "/convert/md-to-pdf", label: "Documents" },
  { href: "/compress", label: "Compress" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <Logo className="h-8 w-8" />
          LocalConvert
        </Link>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground" title="Files never leave your device">
            <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
            <span className="hidden sm:inline">100% local · no uploads</span>
            <span className="sm:hidden">Private</span>
          </span>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile nav: horizontally scrollable chips, no hamburger needed */}
      <nav aria-label="Main (mobile)" className="flex gap-2 overflow-x-auto border-t px-4 py-2 md:hidden [scrollbar-width:none]">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="shrink-0 rounded-full border px-3 py-1 text-sm text-muted-foreground">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
