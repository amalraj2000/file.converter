"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileUp, Loader2, Trash2, X } from "lucide-react";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { useConversionQueue } from "@/hooks/useConversionQueue";
import { COMPRESS_TARGET, FORMATS, commonTargets } from "@/lib/formats";
import { formatBytes } from "@/lib/guardrails";
import { downloadBlob, zipOutputs } from "@/lib/download";
import type { QueueItem } from "@/lib/queue/types";
import { cn } from "@/lib/utils";

const btn = "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50";

export function Converter({ defaultTarget, accept, mode = "convert" }: { defaultTarget?: string; accept?: string; mode?: "convert" | "compress" }) {
  const compress = mode === "compress";
  const { queue, state, media } = useConversionQueue();
  const [dragging, setDragging] = useState(false);
  const [bulkTarget, setBulkTarget] = useState<string>(defaultTarget ?? "");
  const input = useRef<HTMLInputElement>(null);

  const targets = useMemo(
    () => commonTargets(state.items.filter((i) => i.source).map((i) => i.source!.id)),
    [state.items],
  );
  const activeTarget = targets.includes(bulkTarget) ? bulkTarget : "";

  const onFiles = useCallback(
    (list: FileList | File[]) => {
      const files = Array.from(list);
      queue.addFiles(files, compress ? COMPRESS_TARGET : defaultTarget);
      // warm the wasm engine as soon as media is dropped
      if (files.some((f) => /\.(mp4|m4v|webm|mov|avi|mkv|gif|mp3|wav|aac|ogg|m4a|flac)$/i.test(f.name))) void media.preload();
    },
    [queue, defaultTarget, compress, media],
  );

  const done = queue.completed();
  const ready = state.items.some((i) => (i.status === "idle" && i.targetId) || i.status === "cancelled");

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
        onClick={() => input.current?.click()}
        role="button" tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center sm:p-10 transition", dragging ? "border-primary bg-muted" : "hover:bg-muted/60")}
      >
        <FileUp className="h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="font-medium"><span className="hidden sm:inline">{compress ? "Drop any file here or click to browse" : "Drop files here or click to browse"}</span><span className="sm:hidden">Tap to choose files</span></p>
        <p className="text-sm text-muted-foreground">{compress ? "Images, video, audio, PDF, Word, Excel, text — any file type, processed locally" : "Images, video, audio, documents, spreadsheets — processed locally"}</p>
        <input ref={input} type="file" multiple hidden accept={accept} onChange={(e) => { if (e.target.files) onFiles(e.target.files); e.target.value = ""; }} />
      </div>

      <div className="flex justify-end"><SettingsDrawer settings={state.settings} queue={queue} /></div>

      {media.capability?.message && state.items.some((i) => i.engine === "media") && (
        <Notice tone={media.capability.supported ? "warn" : "danger"}>{media.capability.message}</Notice>
      )}
      {media.status === "loading" && <Notice tone="info">Loading the video/audio engine (one-time download)…</Notice>}
      {state.batchWarning && <Notice tone="warn">{state.batchWarning}</Notice>}

      {state.items.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
            {compress ? (
              <>
                <label className="text-sm text-muted-foreground" htmlFor="level">Compression</label>
                <select id="level" value={state.settings.compress.level}
                  onChange={(e) => queue.updateSettings({ compress: { level: e.target.value as "light" | "balanced" | "strong" } })}
                  className="rounded-md border bg-background px-2 py-1.5 text-sm">
                  <option value="light">Light — best quality</option>
                  <option value="balanced">Balanced</option>
                  <option value="strong">Strong — smallest file</option>
                </select>
              </>
            ) : (
              <>
                <label className="text-sm text-muted-foreground" htmlFor="bulk">Convert all to</label>
                <select id="bulk" value={activeTarget} disabled={targets.length === 0}
                  onChange={(e) => { setBulkTarget(e.target.value); if (e.target.value) queue.setAllTargets(e.target.value); }}
                  className="rounded-md border bg-background px-2 py-1.5 text-sm">
                  <option value="">{targets.length ? "Choose…" : "Mixed types — pick per file"}</option>
                  {targets.map((t) => <option key={t} value={t}>{FORMATS[t].label}</option>)}
                </select>
              </>
            )}
            <div className="grid w-full grid-cols-2 gap-2 sm:ml-auto sm:flex sm:w-auto">
              <button className={cn(btn, "col-span-2 bg-primary text-primary-foreground")} disabled={!ready} onClick={() => queue.start()}>{compress ? "Compress" : "Convert"}</button>
              <button className={cn(btn, "border")} disabled={done.length < 2}
                onClick={async () => downloadBlob(await zipOutputs(done.map((d) => d.output!)), compress ? "compressed-files.zip" : "converted-files.zip")}>
                <Download className="h-4 w-4" aria-hidden /> Download all as ZIP
              </button>
              <button className={cn(btn, "border")} onClick={() => queue.clear()}><Trash2 className="h-4 w-4" aria-hidden /> Clear</button>
            </div>
          </div>
          <ul className="divide-y rounded-lg border">
            {state.items.map((it) => <Row key={it.id} it={it} queue={queue} />)}
          </ul>
        </>
      )}
    </div>
  );
}

function Notice({ tone, children }: { tone: "warn" | "danger" | "info"; children: React.ReactNode }) {
  const color = tone === "danger" ? "text-danger" : tone === "warn" ? "text-warning" : "text-muted-foreground";
  return (
    <p role="status" className={cn("flex items-start gap-2 rounded-md border bg-muted/50 p-3 text-sm", color)}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> <span>{children}</span>
    </p>
  );
}

function Row({ it, queue }: { it: QueueItem; queue: ReturnType<typeof useConversionQueue>["queue"] }) {
  const options = it.source && it.engine !== "compress" ? commonTargets([it.source.id]) : [];
  const saved = it.output && it.file.size > 0 ? Math.round((1 - it.output.size / it.file.size) * 100) : null;
  const busy = it.status === "converting" || it.status === "queued";
  return (
    <li className="space-y-2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 basis-full truncate text-sm font-medium sm:basis-0 sm:flex-1" title={it.file.name}>{it.file.name}</span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{formatBytes(it.file.size)}</span>
        {it.output && <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-success">→ {formatBytes(it.output.size)}{it.engine === "compress" && saved !== null && saved > 0 ? ` (−${saved}%)` : ""}</span>}
        {options.length > 0 && (
          <select aria-label={`Target format for ${it.file.name}`} value={it.targetId ?? ""} disabled={busy}
            onChange={(e) => queue.setTarget(it.id, e.target.value)} className="rounded-md border bg-background px-2 py-1 text-sm">
            <option value="">Format…</option>
            {options.map((t) => <option key={t} value={t}>{FORMATS[t].label}</option>)}
          </select>
        )}
        {it.status === "done" && it.output && (
          <button className={cn(btn, "border py-1")} onClick={() => downloadBlob(it.output!.blob, it.output!.name)}>
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden /> Download
          </button>
        )}
        {it.status === "error" && it.guard.level !== "block" && <button className={cn(btn, "border py-1")} onClick={() => queue.retry(it.id)}>Retry</button>}
        {busy ? (
          <button aria-label="Cancel" onClick={() => queue.cancel(it.id)}><X className="h-4 w-4" /></button>
        ) : (
          <button aria-label="Remove" onClick={() => queue.remove(it.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
        )}
      </div>
      {it.status === "converting" && (
        <div className="flex items-center gap-2" aria-live="polite">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          <div className="h-1.5 flex-1 overflow-hidden rounded bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${it.progress}%` }} /></div>
          <span className="w-9 text-right text-xs tabular-nums">{it.progress}%</span>
        </div>
      )}
      {it.status === "queued" && <p className="text-xs text-muted-foreground">Waiting in queue…</p>}
      {it.status === "error" && <p className="text-xs text-danger">{it.error}</p>}
      {it.status === "done" && it.note && <p className="text-xs text-muted-foreground">{it.note}</p>}
      {it.guard.level === "warn" && it.status !== "error" && <p className="text-xs text-warning">{it.guard.message}</p>}
    </li>
  );
}
