"use client";

import { useRef } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { ConversionQueue } from "@/lib/queue/queue-manager";
import type { ConversionSettings } from "@/lib/queue/types";
import { DEFAULT_SETTINGS } from "@/lib/queue/types";

const field = "w-full rounded-md border bg-background px-2 py-1.5 text-sm";

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="flex justify-between text-sm font-medium">{label}{hint && <span className="font-normal text-muted-foreground">{hint}</span>}</span>
      {children}
    </label>
  );
}

/** "" → null (no limit); otherwise a positive integer. */
const optInt = (v: string) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : null; };
const int = (v: string, fallback: number) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : fallback; };

/** Slide-over settings panel built on native <dialog> (focus trap + Esc + backdrop for free). */
export function SettingsDrawer({ settings, queue }: { settings: ConversionSettings; queue: ConversionQueue }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { image: im, media: md, document: doc, compress: cp } = settings;

  return (
    <>
      <button onClick={() => ref.current?.showModal()} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium">
        <SlidersHorizontal className="h-4 w-4" aria-hidden /> Settings
      </button>
      <dialog
        ref={ref}
        aria-labelledby="settings-title"
        onClick={(e) => e.target === ref.current && ref.current.close()}
        className="m-0 ml-auto h-dvh max-h-none w-full max-w-sm bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <h2 id="settings-title" className="font-semibold">Conversion settings</h2>
            <button aria-label="Close settings" onClick={() => ref.current?.close()}><X className="h-4 w-4" /></button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-4">
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">File size reducer</h3>
              <Row label="Compression level">
                <select className={field} value={cp.level} onChange={(e) => queue.updateSettings({ compress: { level: e.target.value as "light" | "balanced" | "strong" } })}>
                  <option value="light">Light — best quality</option>
                  <option value="balanced">Balanced</option>
                  <option value="strong">Strong — smallest file</option>
                </select>
              </Row>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Images</h3>
              <Row label="Quality" hint={`${Math.round(im.quality * 100)}%  (JPG / WEBP / AVIF)`}>
                <input type="range" min={10} max={100} value={Math.round(im.quality * 100)} className="w-full"
                  onChange={(e) => queue.updateSettings({ image: { quality: +e.target.value / 100 } })} />
              </Row>
              <div className="grid grid-cols-2 gap-3">
                <Row label="Max width" hint="px">
                  <input className={field} inputMode="numeric" placeholder="Original" value={im.maxWidth ?? ""}
                    onChange={(e) => queue.updateSettings({ image: { maxWidth: optInt(e.target.value) } })} />
                </Row>
                <Row label="Max height" hint="px">
                  <input className={field} inputMode="numeric" placeholder="Original" value={im.maxHeight ?? ""}
                    onChange={(e) => queue.updateSettings({ image: { maxHeight: optInt(e.target.value) } })} />
                </Row>
              </div>
              <p className="text-xs text-muted-foreground">Aspect ratio is always kept; images are never upscaled.</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Video &amp; audio</h3>
              <Row label="Audio bitrate">
                <select className={field} value={md.audioBitrateKbps} onChange={(e) => queue.updateSettings({ media: { audioBitrateKbps: +e.target.value } })}>
                  {[96, 128, 192, 256, 320].map((b) => <option key={b} value={b}>{b} kbps</option>)}
                </select>
              </Row>
              <Row label="Video quality (CRF)" hint={`${md.videoCrf} — lower is better, bigger`}>
                <input type="range" min={18} max={35} value={md.videoCrf} className="w-full"
                  onChange={(e) => queue.updateSettings({ media: { videoCrf: +e.target.value } })} />
              </Row>
              <Row label="Scale video to width" hint="smaller = less memory">
                <select className={field} value={md.scaleWidth ?? ""} onChange={(e) => queue.updateSettings({ media: { scaleWidth: optInt(e.target.value) } })}>
                  <option value="">Original</option>
                  {[1920, 1280, 854, 640].map((w) => <option key={w} value={w}>{w}px</option>)}
                </select>
              </Row>
              <div className="grid grid-cols-2 gap-3">
                <Row label="GIF fps">
                  <input className={field} inputMode="numeric" value={md.gifFps}
                    onChange={(e) => queue.updateSettings({ media: { gifFps: Math.min(30, int(e.target.value, DEFAULT_SETTINGS.media.gifFps)) } })} />
                </Row>
                <Row label="GIF width" hint="px">
                  <input className={field} inputMode="numeric" value={md.gifWidth}
                    onChange={(e) => queue.updateSettings({ media: { gifWidth: Math.min(1280, int(e.target.value, DEFAULT_SETTINGS.media.gifWidth)) } })} />
                </Row>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documents (PDF output)</h3>
              <div className="grid grid-cols-2 gap-3">
                <Row label="Page size">
                  <select className={field} value={doc.pageSize} onChange={(e) => queue.updateSettings({ document: { pageSize: e.target.value as "a4" | "letter" } })}>
                    <option value="a4">A4</option><option value="letter">US Letter</option>
                  </select>
                </Row>
                <Row label="Orientation">
                  <select className={field} value={doc.orientation} onChange={(e) => queue.updateSettings({ document: { orientation: e.target.value as "portrait" | "landscape" } })}>
                    <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
                  </select>
                </Row>
                <Row label="Margin" hint="mm">
                  <input className={field} inputMode="numeric" value={doc.marginMm}
                    onChange={(e) => queue.updateSettings({ document: { marginMm: Math.min(50, int(e.target.value, DEFAULT_SETTINGS.document.marginMm)) } })} />
                </Row>
                <Row label="Font size" hint="pt">
                  <input className={field} inputMode="numeric" value={doc.fontSize}
                    onChange={(e) => queue.updateSettings({ document: { fontSize: Math.min(32, int(e.target.value, DEFAULT_SETTINGS.document.fontSize)) } })} />
                </Row>
              </div>
            </section>
          </div>

          <div className="flex items-center justify-between border-t p-4">
            <button className="text-sm text-muted-foreground underline" onClick={() => queue.updateSettings(DEFAULT_SETTINGS)}>Reset to defaults</button>
            <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground" onClick={() => ref.current?.close()}>Done</button>
          </div>
        </div>
      </dialog>
    </>
  );
}
