import { detectFormat } from "../formats";
import type { ConversionSettings, ConvertContext, ConvertResult, Converter } from "../queue/types";
import { canvasToBlob, convertImage, fileToCanvas } from "./image";
import { convertMedia } from "./media";

type Level = ConversionSettings["compress"]["level"];

/** Tuning per compression level. `maxDim`/`scale` only ever shrink, never upscale. */
const LEVELS: Record<Level, { imgQ: number; maxDim: number | null; crf: number; scale: number | null; abr: number; gifFps: number; gifWidth: number }> = {
  light: { imgQ: 0.85, maxDim: null, crf: 26, scale: null, abr: 192, gifFps: 12, gifWidth: 480 },
  balanced: { imgQ: 0.72, maxDim: 2560, crf: 28, scale: 1280, abr: 128, gifFps: 10, gifWidth: 400 },
  strong: { imgQ: 0.55, maxDim: 1600, crf: 32, scale: 854, abr: 96, gifFps: 8, gifWidth: 320 },
};

const OFFICE_ZIPS = new Set(["docx", "xlsx", "pptx"]);
const IMAGE_FORMATS = new Set(["jpg", "png", "webp", "avif"]);
const VIDEO_FORMATS = new Set(["mp4", "mov", "webm", "avi", "mkv"]);
/** Audio source → output format (lossless/odd containers go to a compact lossy one). */
const AUDIO_TARGET: Record<string, string> = { mp3: "mp3", wav: "mp3", flac: "mp3", aac: "aac", m4a: "aac", ogg: "ogg" };

const extOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";
const baseOf = (name: string) => name.replace(/\.[^./\\]+$/, "") || "file";
const compressedName = (name: string, ext: string) => `${baseOf(name)}-compressed.${ext}`;

const asResult = (r: Blob | ConvertResult): ConvertResult => (r instanceof Blob ? { blob: r } : r);

async function zipFile(file: File): Promise<ConvertResult> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  zip.file(file.name, file);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
  return { blob, name: `${baseOf(file.name)}.zip` };
}

/** Re-encode embedded JPG/PNG images inside a DOCX/XLSX/PPTX and re-deflate the package. */
async function compressOffice(file: File, level: Level, ctx: ConvertContext): Promise<ConvertResult> {
  const L = LEVELS[level];
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(file);
  const images = Object.values(zip.files).filter((f) => !f.dir && /\.(jpe?g|png)$/i.test(f.name));
  let done = 0;
  for (const entry of images) {
    if (ctx.signal.aborted) throw new DOMException("Cancelled", "AbortError");
    const blob = await entry.async("blob");
    if (blob.size > 30 * 1024) {
      const isJpg = /\.jpe?g$/i.test(entry.name);
      try {
        const canvas = await fileToCanvas(blob, { maxWidth: L.maxDim, maxHeight: L.maxDim, background: isJpg ? "#ffffff" : undefined });
        const out = await canvasToBlob(canvas, isJpg ? "image/jpeg" : "image/png", L.imgQ);
        if (out.size < blob.size) zip.file(entry.name, out);
      } catch {
        /* undecodable image: leave as is */
      }
    }
    ctx.onProgress(10 + (++done / images.length) * 80);
  }
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
    mimeType: file.type || "application/octet-stream",
  });
  return { blob, name: compressedName(file.name, extOf(file.name)) };
}

async function compressPdf(file: File): Promise<ConvertResult> {
  const { PDFDocument } = await import("pdf-lib");
  let doc;
  try {
    doc = await PDFDocument.load(await file.arrayBuffer());
  } catch {
    throw new Error("This PDF couldn't be read (it may be password-protected or damaged).");
  }
  const bytes = await doc.save({ useObjectStreams: true });
  return {
    blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
    name: compressedName(file.name, "pdf"),
    note: "PDFs get structural optimization only; scanned or image-heavy PDFs shrink little.",
  };
}

async function compressJson(file: File): Promise<ConvertResult | null> {
  try {
    const min = JSON.stringify(JSON.parse(await file.text()));
    return { blob: new Blob([min], { type: "application/json" }), name: compressedName(file.name, "json") };
  } catch {
    return null; // not valid JSON → generic zip
  }
}

/** Single entry point: pick the best strategy for any file, never return something larger than the input. */
export const compressFile: Converter = async (file, _target, ctx) => {
  const level = ctx.settings.compress.level;
  const L = LEVELS[level];
  const src = detectFormat(file)?.id ?? extOf(file.name);
  ctx.onProgress(5);

  let res: ConvertResult;

  if (IMAGE_FORMATS.has(src)) {
    const s = { ...ctx.settings, image: { quality: L.imgQ, maxWidth: L.maxDim, maxHeight: L.maxDim } };
    res = { blob: asResult(await convertImage(file, src, { ...ctx, settings: s })).blob, name: compressedName(file.name, src) };
  } else if (src === "bmp") {
    const s = { ...ctx.settings, image: { quality: 1, maxWidth: L.maxDim, maxHeight: L.maxDim } };
    res = { blob: asResult(await convertImage(file, "png", { ...ctx, settings: s })).blob, name: compressedName(file.name, "png") };
  } else if (src === "gif") {
    const s = { ...ctx.settings, media: { ...ctx.settings.media, gifFps: L.gifFps, gifWidth: L.gifWidth } };
    res = { blob: asResult(await convertMedia(file, "gif", { ...ctx, settings: s })).blob, name: compressedName(file.name, "gif") };
  } else if (VIDEO_FORMATS.has(src)) {
    const target = src === "mkv" ? "mp4" : src;
    const s = { ...ctx.settings, media: { ...ctx.settings.media, videoCrf: L.crf, scaleWidth: L.scale, audioBitrateKbps: L.abr } };
    res = { blob: asResult(await convertMedia(file, target, { ...ctx, settings: s })).blob, name: compressedName(file.name, target) };
  } else if (AUDIO_TARGET[src]) {
    const target = AUDIO_TARGET[src];
    const s = { ...ctx.settings, media: { ...ctx.settings.media, audioBitrateKbps: L.abr } };
    res = { blob: asResult(await convertMedia(file, target, { ...ctx, settings: s })).blob, name: compressedName(file.name, target) };
  } else if (src === "pdf") {
    res = await compressPdf(file);
  } else if (OFFICE_ZIPS.has(src)) {
    res = await compressOffice(file, level, ctx);
  } else if (src === "json") {
    res = (await compressJson(file)) ?? (await zipFile(file));
  } else {
    // text, CSV, spreadsheets, archives, unknown types: lossless DEFLATE into a .zip
    res = await zipFile(file);
  }

  ctx.onProgress(100);
  if (res.blob.size >= file.size) {
    return { blob: file, name: file.name, note: "Already well compressed — the original was kept because it couldn't be made smaller." };
  }
  return res;
};
