import type { Category } from "./formats";

const MB = 1024 * 1024;

export type GuardLevel = "ok" | "warn" | "block";
export interface Guard {
  level: GuardLevel;
  message: string | null;
}

/**
 * Browser memory guardrails. ffmpeg.wasm holds input + output in a 32-bit WASM heap
 * (hard ceiling ~2 GB, practical ceiling far lower), and every file is also kept as a
 * Blob/ArrayBuffer in JS memory, so we warn early and block before the tab crashes.
 */
const LIMITS: Record<"image" | "media" | "document", { warn: number; block: number }> = {
  image: { warn: 25 * MB, block: 150 * MB },
  media: { warn: 100 * MB, block: 1024 * MB },
  document: { warn: 20 * MB, block: 100 * MB },
};

const BATCH_WARN_BYTES = 1024 * MB;

const limitKey = (c: Category) =>
  c === "video" || c === "audio" ? "media" : c === "image" ? "image" : "document";

/** Low-memory devices (Chromium `deviceMemory`, in GB) get tighter limits. */
function memoryFactor(): number {
  if (typeof navigator === "undefined") return 1;
  const gb = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return gb && gb <= 4 ? 0.5 : 1;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < MB) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * MB) return `${(n / MB).toFixed(1)} MB`;
  return `${(n / 1024 / MB).toFixed(2)} GB`;
}

export function assessFile(size: number, category: Category | null): Guard {
  if (category === null) {
    return { level: "block", message: "Unsupported file type. This file can't be converted." };
  }
  if (size === 0) return { level: "block", message: "This file is empty." };
  const k = limitKey(category);
  const f = memoryFactor();
  const { warn, block } = LIMITS[k];
  if (size > block * f) {
    return {
      level: "block",
      message: `${formatBytes(size)} is too large to convert safely in the browser (limit ${formatBytes(block * f)}). Try a smaller file or a desktop tool.`,
    };
  }
  if (size > warn * f) {
    return {
      level: "warn",
      message:
        k === "media"
          ? `Large ${category} (${formatBytes(size)}): it will be loaded fully into browser memory and may be slow or crash a low-memory tab. Close other tabs first.`
          : `Large file (${formatBytes(size)}) — conversion may be slow and memory-hungry.`,
    };
  }
  return { level: "ok", message: null };
}

export function assessBatch(pendingBytes: number): string | null {
  const limit = BATCH_WARN_BYTES * memoryFactor();
  return pendingBytes > limit
    ? `The queue holds ${formatBytes(pendingBytes)} of files. Everything lives in browser memory — consider converting in smaller batches.`
    : null;
}
