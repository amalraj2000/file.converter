import { assessBatch, assessFile } from "../guardrails";
import { COMPRESS_TARGET, canConvert, detectFormat, engineFor, outputName, type Engine } from "../formats";
import {
  DEFAULT_SETTINGS,
  type ConversionSettings,
  type Converter,
  type QueueItem,
  type QueueSnapshot,
} from "./types";

/** ffmpeg.wasm is a single shared instance → strictly one media job at a time. */
/** compress may call ffmpeg internally, so it is serialized too. */
const CONCURRENCY: Record<Engine, number> = { image: 3, document: 2, media: 1, compress: 1 };

type Converters = Record<Engine, Converter>;

let seq = 0;
const newId = () => `job_${Date.now().toString(36)}_${(seq++).toString(36)}`;

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Unified queue. Plain class + subscribe/getSnapshot so React reads it through
 * useSyncExternalStore; all state transitions are immutable and emit a new snapshot.
 */
export class ConversionQueue {
  private items: QueueItem[] = [];
  private settings: ConversionSettings = DEFAULT_SETTINGS;
  private running: Record<Engine, number> = { image: 0, media: 0, document: 0, compress: 0 };
  private controllers = new Map<string, AbortController>();
  private listeners = new Set<() => void>();
  private snapshot: QueueSnapshot;

  constructor(private readonly getConverters: () => Converters) {
    this.snapshot = this.build();
  }

  // ---- external-store contract ----
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };
  getSnapshot = () => this.snapshot;

  // ---- public API ----
  addFiles(files: File[], preferredTarget?: string | null) {
    const added = files.map((file): QueueItem => {
      const compress = preferredTarget === COMPRESS_TARGET;
      const source = detectFormat(file);
      // Compress accepts ANY file type; unknown types are guarded like generic documents.
      const guard = assessFile(file.size, compress ? (source?.category ?? "document") : (source?.category ?? null));
      const target = compress
        ? COMPRESS_TARGET
        : source && preferredTarget && canConvert(source.id, preferredTarget) ? preferredTarget : null;
      return {
        id: newId(),
        file,
        source,
        targetId: target,
        engine: compress ? "compress" : source && target ? engineFor(source.id, target) : null,
        status: guard.level === "block" ? "error" : "idle",
        progress: 0,
        guard,
        error: guard.level === "block" ? (guard.message ?? undefined) : undefined,
      };
    });
    this.items = [...this.items, ...added];
    this.emit();
  }

  setTarget(id: string, targetId: string) {
    this.patch(id, (it) => {
      if (it.engine === "compress") return it; // compress items have a fixed target
      if (!it.source || !canConvert(it.source.id, targetId) || it.status === "converting") return it;
      return {
        ...it,
        targetId,
        engine: engineFor(it.source.id, targetId),
        // changing target invalidates a previous result
        output: undefined,
        progress: 0,
        error: undefined,
        status: it.guard.level === "block" ? "error" : "idle",
      };
    });
  }

  /** Apply one target to every item that supports it. */
  setAllTargets(targetId: string) {
    for (const it of this.items) this.setTarget(it.id, targetId);
  }

  updateSettings(patch: Partial<{ [K in keyof ConversionSettings]: Partial<ConversionSettings[K]> }>) {
    this.settings = {
      image: { ...this.settings.image, ...patch.image },
      media: { ...this.settings.media, ...patch.media },
      document: { ...this.settings.document, ...patch.document },
      compress: { ...this.settings.compress, ...patch.compress },
    };
    this.emit();
  }

  /** Queue every convertible item that has a target, then start pumping. */
  start() {
    this.items = this.items.map((it) =>
      it.targetId && it.guard.level !== "block" && (it.status === "idle" || it.status === "cancelled")
        ? { ...it, status: "queued", progress: 0, error: undefined }
        : it,
    );
    this.emit();
    this.pump();
  }

  retry(id: string) {
    this.patch(id, (it) =>
      it.status === "error" && it.targetId && it.guard.level !== "block"
        ? { ...it, status: "queued", progress: 0, error: undefined }
        : it,
    );
    this.pump();
  }

  cancel(id: string) {
    const c = this.controllers.get(id);
    if (c) c.abort();
    else this.patch(id, (it) => (it.status === "queued" ? { ...it, status: "cancelled" } : it));
  }

  cancelAll() {
    for (const it of this.items) this.cancel(it.id);
  }

  remove(id: string) {
    this.controllers.get(id)?.abort();
    this.items = this.items.filter((it) => it.id !== id);
    this.emit();
  }

  clear() {
    this.cancelAll();
    this.items = [];
    this.emit();
  }

  completed() {
    return this.items.filter((it) => it.status === "done" && it.output);
  }

  // ---- internals ----
  private pump() {
    for (const it of this.items) {
      if (it.status !== "queued" || !it.engine) continue;
      if (this.running[it.engine] >= CONCURRENCY[it.engine]) continue;
      void this.run(it);
    }
  }

  private async run(item: QueueItem) {
    const engine = item.engine!;
    const controller = new AbortController();
    this.controllers.set(item.id, controller);
    this.running[engine]++;
    this.patch(item.id, (it) => ({ ...it, status: "converting", progress: 0 }));

    try {
      const convert = this.getConverters()[engine];
      const result = await convert(item.file, item.targetId!, {
        settings: this.settings,
        signal: controller.signal,
        onProgress: (p) => {
          if (controller.signal.aborted) return;
          this.patch(item.id, (it) => ({ ...it, progress: Math.max(0, Math.min(100, Math.round(p))) }));
        },
      });
      if (controller.signal.aborted) throw new DOMException("Cancelled", "AbortError");
      const out = result instanceof Blob ? { blob: result } : result;
      this.patch(item.id, (it) => ({
        ...it,
        status: "done",
        progress: 100,
        note: out.note,
        output: { blob: out.blob, name: out.name ?? outputName(it.file.name, it.targetId!), size: out.blob.size },
      }));
    } catch (e) {
      const cancelled = controller.signal.aborted;
      this.patch(item.id, (it) => ({
        ...it,
        status: cancelled ? "cancelled" : "error",
        error: cancelled ? undefined : errMsg(e),
      }));
    } finally {
      this.controllers.delete(item.id);
      this.running[engine]--;
      this.pump();
    }
  }

  private patch(id: string, fn: (it: QueueItem) => QueueItem) {
    this.items = this.items.map((it) => (it.id === id ? fn(it) : it));
    this.emit();
  }

  private build(): QueueSnapshot {
    const pendingBytes = this.items
      .filter((i) => i.status !== "done" && i.status !== "error")
      .reduce((n, i) => n + i.file.size, 0);
    return {
      items: this.items,
      settings: this.settings,
      batchWarning: assessBatch(pendingBytes),
      counts: {
        total: this.items.length,
        done: this.items.filter((i) => i.status === "done").length,
        active: this.items.filter((i) => i.status === "queued" || i.status === "converting").length,
        failed: this.items.filter((i) => i.status === "error").length,
      },
    };
  }

  private emit() {
    this.snapshot = this.build();
    this.listeners.forEach((l) => l());
  }
}
