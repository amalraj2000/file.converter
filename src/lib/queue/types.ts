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
  compress: {
    level: "light" | "balanced" | "strong";
  };
}

export const DEFAULT_SETTINGS: ConversionSettings = {
  image: { quality: 0.85, maxWidth: null, maxHeight: null },
  media: { audioBitrateKbps: 192, videoCrf: 23, scaleWidth: null, gifFps: 12, gifWidth: 480 },
  document: { pageSize: "a4", orientation: "portrait", marginMm: 15, fontSize: 11 },
  compress: { level: "balanced" },
};

export interface ConvertContext {
  settings: ConversionSettings;
  /** 0–100 */
  onProgress: (percent: number) => void;
  signal: AbortSignal;
}

export interface ConvertResult {
  blob: Blob;
  /** Output filename; defaults to the source name with the target extension. */
  name?: string;
  /** Short message shown under the row (e.g. "already optimized"). */
  note?: string;
}

/** Every engine (image / media / document / compress) exposes this single shape. */
export type Converter = (file: File, targetId: string, ctx: ConvertContext) => Promise<Blob | ConvertResult>;

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
  note?: string;
  output?: { blob: Blob; name: string; size: number };
}

export interface QueueSnapshot {
  items: QueueItem[];
  settings: ConversionSettings;
  /** Aggregate-memory warning for the whole pending batch, or null. */
  batchWarning: string | null;
  counts: { total: number; done: number; active: number; failed: number };
}
