import type { Engine, FormatDef } from "../formats";
import type { Guard } from "../guardrails";

export interface ConversionSettings {
  image: {
    /** 0–1, applies to JPG/WEBP/AVIF. PNG/BMP/ICO are lossless. */
    quality: number;
    maxWidth: number | null;
    maxHeight: number | null;
  };
  media: {
    audioBitrateKbps: number;
    /** x264 CRF: lower = better quality / bigger file. */
    videoCrf: number;
    /** Downscale video to this width (height auto). null = keep. */
    scaleWidth: number | null;
    gifFps: number;
    gifWidth: number;
  };
  document: {
    pageSize: "a4" | "letter";
    orientation: "portrait" | "landscape";
    marginMm: number;
    fontSize: number;
  };
}

export const DEFAULT_SETTINGS: ConversionSettings = {
  image: { quality: 0.85, maxWidth: null, maxHeight: null },
  media: { audioBitrateKbps: 192, videoCrf: 23, scaleWidth: null, gifFps: 12, gifWidth: 480 },
  document: { pageSize: "a4", orientation: "portrait", marginMm: 15, fontSize: 11 },
};

export interface ConvertContext {
  settings: ConversionSettings;
  /** 0–100 */
  onProgress: (percent: number) => void;
  signal: AbortSignal;
}

/** Every engine (image / media / document) exposes this single shape. */
export type Converter = (file: File, targetId: string, ctx: ConvertContext) => Promise<Blob>;

export type JobStatus = "idle" | "queued" | "converting" | "done" | "error" | "cancelled";

export interface QueueItem {
  id: string;
  file: File;
  /** null = unsupported input type */
  source: FormatDef | null;
  targetId: string | null;
  engine: Engine | null;
  status: JobStatus;
  progress: number;
  guard: Guard;
  error?: string;
  output?: { blob: Blob; name: string; size: number };
}

export interface QueueSnapshot {
  items: QueueItem[];
  settings: ConversionSettings;
  /** Aggregate-memory warning for the whole pending batch, or null. */
  batchWarning: string | null;
  counts: { total: number; done: number; active: number; failed: number };
}
