import type { FFmpeg } from "@ffmpeg/ffmpeg";
import type { ConversionSettings, Converter } from "../queue/types";

export interface MediaCapability {
  /** Hard requirements (WebAssembly + Worker) are met. */
  supported: boolean;
  /** SharedArrayBuffer available (cross-origin isolated). Needed for multi-threaded cores. */
  isolated: boolean;
  message: string | null;
}

export function getMediaCapability(): MediaCapability {
  if (typeof WebAssembly === "undefined" || typeof Worker === "undefined") {
    return { supported: false, isolated: false, message: "This browser doesn't support WebAssembly workers, which video/audio conversion requires." };
  }
  const isolated = typeof SharedArrayBuffer !== "undefined" && globalThis.crossOriginIsolated === true;
  return {
    supported: true,
    isolated,
    message: isolated
      ? null
      : "SharedArrayBuffer is unavailable (page isn't cross-origin isolated). Falling back to the single-threaded engine — conversions work but are slower.",
  };
}

// ---- singleton ffmpeg instance (one wasm heap per tab) ----
let instance: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

export function loadFFmpeg(): Promise<FFmpeg> {
  if (instance) return Promise.resolve(instance);
  loading ??= (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const ff = new FFmpeg();
    // Same-origin files copied to /public/ffmpeg by scripts/copy-ffmpeg.mjs.
    // classWorkerURL avoids the Next.js bundler choking on ffmpeg's dynamic worker import.
    // Absolute URLs: ffmpeg resolves relative ones against its own bundle location.
    const base = `${location.origin}/ffmpeg`;
    await ff.load({
      classWorkerURL: `${base}/814.ffmpeg.js`,
      coreURL: `${base}/ffmpeg-core.js`,
      wasmURL: `${base}/ffmpeg-core.wasm`,
    });
    instance = ff;
    return ff;
  })().catch((e) => {
    loading = null;
    throw new Error(`Couldn't load the conversion engine (${e instanceof Error ? e.message : e}). Check your connection and reload.`);
  });
  return loading;
}

function resetFFmpeg() {
  try { instance?.terminate(); } catch { /* already dead */ }
  instance = null;
  loading = null;
}

const AUDIO_ONLY = new Set(["mp3", "wav", "aac", "ogg"]);

export function buildArgs(target: string, input: string, output: string, s: ConversionSettings["media"]): string[] {
  const vf = s.scaleWidth ? ["-vf", `scale=${s.scaleWidth}:-2`] : [];
  const ab = `${s.audioBitrateKbps}k`;
  const crf = String(s.videoCrf);
  // libvorbis rejects fixed bitrates that don't suit the input sample rate → use quality mode.
  const vq = String(({ 96: 3, 128: 4, 192: 6, 256: 8, 320: 9 } as Record<number, number>)[s.audioBitrateKbps] ?? 5);
  switch (target) {
    case "mp4":
      return ["-i", input, ...vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", crf, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", ab, "-movflags", "+faststart", output];
    case "mov":
      return ["-i", input, ...vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", crf, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", ab, "-f", "mov", output];
    case "webm": // VP8 + Vorbis: far faster than VP9 in wasm
      return ["-i", input, ...vf, "-c:v", "libvpx", "-b:v", "1500k", "-crf", String(Math.min(63, s.videoCrf)), "-c:a", "libvorbis", "-q:a", vq, output];
    case "avi":
      return ["-i", input, ...vf, "-c:v", "mpeg4", "-q:v", "5", "-c:a", "libmp3lame", "-b:a", ab, output];
    case "gif":
      return ["-i", input, "-an", "-vf", `fps=${s.gifFps},scale=${s.gifWidth}:-1:flags=lanczos`, "-loop", "0", output];
    case "mp3":
      return ["-i", input, "-vn", "-c:a", "libmp3lame", "-b:a", ab, output];
    case "wav":
      return ["-i", input, "-vn", "-c:a", "pcm_s16le", output];
    case "aac":
      return ["-i", input, "-vn", "-c:a", "aac", "-b:a", ab, "-f", "adts", output];
    case "ogg":
      return ["-i", input, "-vn", "-c:a", "libvorbis", "-q:a", vq, output];
    default:
      throw new Error(`Unsupported media target: ${target}`);
  }
}

const MIME: Record<string, string> = {
  mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm", avi: "video/x-msvideo", gif: "image/gif",
  mp3: "audio/mpeg", wav: "audio/wav", aac: "audio/aac", ogg: "audio/ogg",
};

export const convertMedia: Converter = async (file, targetId, { settings, onProgress, signal }) => {
  const cap = getMediaCapability();
  if (!cap.supported) throw new Error(cap.message!);

  const ff = await loadFFmpeg();
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");

  const inExt = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const input = `input.${inExt}`;
  const output = `output.${targetId}`;

  const onProg = ({ progress }: { progress: number }) => {
    // ffmpeg can report <0 or >1 when duration is unknown
    if (Number.isFinite(progress)) onProgress(Math.max(0, Math.min(99, progress * 100)));
  };
  // Terminating is the only reliable way to stop a running wasm exec().
  const onAbort = () => resetFFmpeg();
  signal.addEventListener("abort", onAbort, { once: true });
  ff.on("progress", onProg);
  const logTail: string[] = [];
  const onLog = ({ message }: { message: string }) => {
    logTail.push(message);
    if (logTail.length > 6) logTail.shift();
  };
  ff.on("log", onLog);

  try {
    await ff.writeFile(input, new Uint8Array(await file.arrayBuffer()));
    const code = await ff.exec(buildArgs(targetId, input, output, settings.media));
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    if (code !== 0) {
      const detail = logTail.filter((l) => /error|unknown|invalid|not found|unsupported|encoder/i.test(l)).pop();
      throw new Error(
        (AUDIO_ONLY.has(targetId)
          ? "ffmpeg couldn't extract audio from this file (it may have no audio track or use an unsupported codec)."
          : "ffmpeg failed to convert this file (unsupported codec or corrupted input).") + (detail ? ` [${detail.trim()}]` : ""),
      );
    }
    const data = await ff.readFile(output);
    if (typeof data === "string") throw new Error("Unexpected text output from ffmpeg.");
    onProgress(100);
    return new Blob([data as BlobPart], { type: MIME[targetId] ?? "application/octet-stream" });
  } catch (e) {
    if (signal.aborted) throw e;
    // Out-of-memory in wasm typically surfaces as an abort/RuntimeError — the heap is poisoned, so reload it.
    const msg = e instanceof Error ? e.message : String(e);
    if (/memory|abort|RuntimeError|unreachable/i.test(msg)) {
      resetFFmpeg();
      throw new Error("The browser ran out of memory while converting. Try a smaller file or lower the resolution/bitrate in settings.");
    }
    throw e;
  } finally {
    signal.removeEventListener("abort", onAbort);
    if (instance === ff) {
      ff.off("progress", onProg);
      ff.off("log", onLog);
      // free the wasm FS so repeated conversions don't leak the heap
      await ff.deleteFile(input).catch(() => {});
      await ff.deleteFile(output).catch(() => {});
    }
  }
};
