import type { Converter } from "../queue/types";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export function fitWithin(w: number, h: number, maxW: number | null, maxH: number | null) {
  let scale = 1; // never upscale
  if (maxW && w > maxW) scale = Math.min(scale, maxW / w);
  if (maxH && h > maxH) scale = Math.min(scale, maxH / h);
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas export failed."))), type, quality),
  );
}

/** Decode any browser-readable image into a (optionally resized, optionally flattened) canvas. */
export async function fileToCanvas(
  file: Blob,
  opts: { maxWidth?: number | null; maxHeight?: number | null; background?: string } = {},
): Promise<HTMLCanvasElement> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image couldn't be decoded. It may be corrupted or use a format this browser can't read.");
  }
  const { width, height } = fitWithin(bitmap.width, bitmap.height, opts.maxWidth ?? null, opts.maxHeight ?? null);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");
  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas;
}

/** 24-bit BMP (canvas can't encode BMP natively). Alpha is flattened onto white. */
function encodeBmp(img: ImageData): Blob {
  const { width: w, height: h, data } = img;
  const rowSize = Math.ceil((w * 3) / 4) * 4;
  const size = 54 + rowSize * h;
  const buf = new ArrayBuffer(size);
  const v = new DataView(buf);
  v.setUint8(0, 0x42); v.setUint8(1, 0x4d);
  v.setUint32(2, size, true);
  v.setUint32(10, 54, true);
  v.setUint32(14, 40, true);
  v.setInt32(18, w, true);
  v.setInt32(22, h, true);
  v.setUint16(26, 1, true);
  v.setUint16(28, 24, true);
  v.setUint32(34, rowSize * h, true);
  v.setInt32(38, 2835, true);
  v.setInt32(42, 2835, true);
  let row = 54;
  for (let y = h - 1; y >= 0; y--) {
    let p = row;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3] / 255;
      v.setUint8(p++, Math.round(data[i + 2] * a + 255 * (1 - a)));
      v.setUint8(p++, Math.round(data[i + 1] * a + 255 * (1 - a)));
      v.setUint8(p++, Math.round(data[i] * a + 255 * (1 - a)));
    }
    row += rowSize;
  }
  return new Blob([buf], { type: "image/bmp" });
}

/** Single-image ICO with an embedded PNG (supported by all modern OSes/browsers), max 256px. */
async function encodeIco(canvas: HTMLCanvasElement): Promise<Blob> {
  const png = new Uint8Array(await (await canvasToBlob(canvas, "image/png")).arrayBuffer());
  const header = new ArrayBuffer(22);
  const v = new DataView(header);
  v.setUint16(2, 1, true); // type: icon
  v.setUint16(4, 1, true); // count
  v.setUint8(6, canvas.width >= 256 ? 0 : canvas.width);
  v.setUint8(7, canvas.height >= 256 ? 0 : canvas.height);
  v.setUint16(10, 1, true); // planes
  v.setUint16(12, 32, true); // bpp
  v.setUint32(14, png.length, true);
  v.setUint32(18, 22, true); // data offset
  return new Blob([header, png as BlobPart], { type: "image/x-icon" });
}

let avifSupport: Promise<boolean> | null = null;
/** Canvas silently falls back to PNG when it can't encode a type, so probe the output type. */
export function canEncodeAvif(): Promise<boolean> {
  avifSupport ??= (async () => {
    try {
      const c = document.createElement("canvas");
      c.width = c.height = 2;
      const b = await canvasToBlob(c, "image/avif", 0.5);
      return b.type === "image/avif";
    } catch {
      return false;
    }
  })();
  return avifSupport;
}

export const convertImage: Converter = async (file, targetId, { settings, onProgress, signal }) => {
  const s = settings.image;
  onProgress(5);

  // Fast path: browser-image-compression (worker-based, EXIF-aware) for PNG/WEBP when at
  // most one bounding dimension is requested. JPG goes through canvas to flatten alpha.
  const oneDim = !s.maxWidth || !s.maxHeight || s.maxWidth === s.maxHeight;
  if ((targetId === "png" || targetId === "webp") && oneDim) {
    const { default: imageCompression } = await import("browser-image-compression");
    try {
      const out = await imageCompression(file, {
        fileType: MIME[targetId],
        initialQuality: s.quality,
        maxWidthOrHeight: Math.max(s.maxWidth ?? 0, s.maxHeight ?? 0) || undefined,
        alwaysKeepResolution: !(s.maxWidth || s.maxHeight),
        maxSizeMB: Number.POSITIVE_INFINITY,
        useWebWorker: true,
        preserveExif: false,
        signal,
        onProgress: (p: number) => onProgress(5 + p * 0.9),
      });
      if (out.type === MIME[targetId]) return out;
      // library returned something unexpected → fall through to canvas path
    } catch (e) {
      if (signal.aborted) throw e;
    }
  }

  const canvas = await fileToCanvas(file, {
    maxWidth: targetId === "ico" ? 256 : s.maxWidth,
    maxHeight: targetId === "ico" ? 256 : s.maxHeight,
    background: targetId === "jpg" || targetId === "bmp" ? "#ffffff" : undefined,
  });
  onProgress(60);

  if (targetId === "bmp") {
    return encodeBmp(canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height));
  }
  if (targetId === "ico") return encodeIco(canvas);

  // AVIF: native canvas encoder when present, otherwise a WASM encoder (@jsquash/avif).
  if (targetId === "avif" && !(await canEncodeAvif())) {
    const { encode } = await import("@jsquash/avif");
    const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
    const buf = await encode(data, { quality: Math.round(s.quality * 100), speed: 8 });
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    onProgress(100);
    return new Blob([buf], { type: "image/avif" });
  }

  const type = MIME[targetId];
  if (!type) throw new Error(`Unsupported image target: ${targetId}`);
  const blob = await canvasToBlob(canvas, type, s.quality);
  if (blob.type !== type) {
    throw new Error(
      `This browser can't encode ${targetId.toUpperCase()}. Try a Chromium-based browser, or choose PNG/WEBP/JPG.`,
    );
  }
  onProgress(100);
  return blob;
};
