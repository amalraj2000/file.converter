export type Category = "image" | "video" | "audio" | "document" | "spreadsheet" | "text";
export type Engine = "image" | "media" | "document";

export interface FormatDef {
  id: string;
  label: string;
  category: Category;
  mime: string;
  exts: string[];
}

const def = (id: string, label: string, category: Category, mime: string, exts: string[] = [id]): FormatDef => ({
  id, label, category, mime, exts,
});

const LIST: FormatDef[] = [
  // images
  def("jpg", "JPG", "image", "image/jpeg", ["jpg", "jpeg"]),
  def("png", "PNG", "image", "image/png"),
  def("webp", "WEBP", "image", "image/webp"),
  def("avif", "AVIF", "image", "image/avif"),
  def("bmp", "BMP", "image", "image/bmp"),
  def("ico", "ICO", "image", "image/x-icon", ["ico"]),
  // video (gif lives here: as a *target* it is produced by ffmpeg)
  def("gif", "GIF", "video", "image/gif"),
  def("mp4", "MP4", "video", "video/mp4", ["mp4", "m4v"]),
  def("webm", "WEBM", "video", "video/webm"),
  def("mov", "MOV", "video", "video/quicktime"),
  def("avi", "AVI", "video", "video/x-msvideo"),
  def("mkv", "MKV", "video", "video/x-matroska"),
  // audio
  def("mp3", "MP3", "audio", "audio/mpeg"),
  def("wav", "WAV", "audio", "audio/wav", ["wav", "wave"]),
  def("aac", "AAC", "audio", "audio/aac", ["aac"]),
  def("ogg", "OGG", "audio", "audio/ogg", ["ogg", "oga"]),
  def("m4a", "M4A", "audio", "audio/mp4"),
  def("flac", "FLAC", "audio", "audio/flac"),
  // documents / data / text
  def("pdf", "PDF", "document", "application/pdf"),
  def("docx", "DOCX", "document", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
  def("xlsx", "XLSX", "spreadsheet", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
  def("xls", "XLS", "spreadsheet", "application/vnd.ms-excel"),
  def("csv", "CSV", "spreadsheet", "text/csv"),
  def("json", "JSON", "text", "application/json"),
  def("md", "Markdown", "text", "text/markdown", ["md", "markdown"]),
  def("html", "HTML", "text", "text/html", ["html", "htm"]),
  def("txt", "TXT", "text", "text/plain"),
];

export const FORMATS: Readonly<Record<string, FormatDef>> = Object.fromEntries(LIST.map((f) => [f.id, f]));

const BY_EXT = new Map<string, FormatDef>(LIST.flatMap((f) => f.exts.map((e) => [e, f] as const)));
const BY_MIME = new Map<string, FormatDef>(LIST.map((f) => [f.mime, f] as const));

/** Detect by extension first (browsers often give an empty/odd MIME), MIME as fallback. */
export function detectFormat(file: { name: string; type: string }): FormatDef | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return BY_EXT.get(ext) ?? BY_MIME.get(file.type) ?? null;
}

// ---------- conversion graph ----------

const without = (xs: string[], self: string) => xs.filter((x) => x !== self);
const IMAGE_TARGETS = ["jpg", "png", "webp", "avif", "bmp", "ico", "pdf"];
const VIDEO_TARGETS = ["mp4", "webm", "mov", "avi", "gif", "mp3", "wav", "aac", "ogg"];
const AUDIO_TARGETS = ["mp3", "wav", "aac", "ogg"];

export const CONVERSIONS: Readonly<Record<string, string[]>> = {
  jpg: without(IMAGE_TARGETS, "jpg"),
  png: without(IMAGE_TARGETS, "png"),
  webp: without(IMAGE_TARGETS, "webp"),
  avif: without(IMAGE_TARGETS, "avif"),
  bmp: without(IMAGE_TARGETS, "bmp"),
  gif: ["png", "jpg", "webp", "mp4", "webm", "mov", "avi"], // image targets use the first frame
  mp4: without(VIDEO_TARGETS, "mp4"),
  webm: without(VIDEO_TARGETS, "webm"),
  mov: without(VIDEO_TARGETS, "mov"),
  avi: without(VIDEO_TARGETS, "avi"),
  mkv: VIDEO_TARGETS,
  mp3: without(AUDIO_TARGETS, "mp3"),
  wav: without(AUDIO_TARGETS, "wav"),
  aac: without(AUDIO_TARGETS, "aac"),
  ogg: without(AUDIO_TARGETS, "ogg"),
  m4a: AUDIO_TARGETS,
  flac: AUDIO_TARGETS,
  csv: ["xlsx", "json"],
  xlsx: ["csv", "json"],
  xls: ["csv", "json", "xlsx"],
  json: ["csv", "xlsx"],
  md: ["html", "pdf"],
  docx: ["pdf", "txt", "html"],
  txt: ["pdf", "docx"],
};

export const targetsFor = (sourceId: string): string[] => CONVERSIONS[sourceId] ?? [];
export const canConvert = (src: string, tgt: string) => targetsFor(src).includes(tgt);

/** Smart picker: only targets valid for *every* selected source format. */
export function commonTargets(sourceIds: string[]): string[] {
  const unique = [...new Set(sourceIds)];
  if (unique.length === 0) return [];
  return unique.map(targetsFor).reduce((a, b) => a.filter((x) => b.includes(x)));
}

/** Which converter implementation handles this pair. Determined by the *target* kind. */
export function engineFor(_src: string, tgt: string): Engine {
  const t = FORMATS[tgt];
  if (!t) return "document";
  if (t.category === "video" || t.category === "audio") return "media";
  if (t.category === "image") return "image";
  return "document";
}

// ---------- slugs (/convert/jpg-to-png) ----------

export const slugFor = (src: string, tgt: string) => `${src}-to-${tgt}`;

export function parseSlug(slug: string): { source: FormatDef; target: FormatDef } | null {
  const m = /^([a-z0-9]+)-to-([a-z0-9]+)$/.exec(slug);
  if (!m) return null;
  const source = FORMATS[m[1] === "jpeg" ? "jpg" : m[1]];
  const target = FORMATS[m[2]];
  return source && target && canConvert(source.id, target.id) ? { source, target } : null;
}

export const allSlugs = (): string[] =>
  Object.entries(CONVERSIONS).flatMap(([src, tgts]) => tgts.map((t) => slugFor(src, t)));

export const outputName = (inputName: string, targetId: string) => {
  const base = inputName.replace(/\.[^./\\]+$/, "") || "file";
  return `${base}.${FORMATS[targetId]?.exts[0] ?? targetId}`;
};
