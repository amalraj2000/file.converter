import { detectFormat } from "../formats";
import type { ConversionSettings, Converter } from "../queue/types";
import { canvasToBlob, fileToCanvas } from "./image";

type DocSettings = ConversionSettings["document"];

const textBlob = (s: string, type: string) => new Blob([s], { type: `${type};charset=utf-8` });
const jsonBlob = (v: unknown) => textBlob(JSON.stringify(v, null, 2), "application/json");

// ---------- spreadsheets / data ----------

async function readSheets(file: File) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  return { XLSX, wb };
}

async function parseCsv(file: File) {
  const Papa = (await import("papaparse")).default;
  const res = Papa.parse<Record<string, unknown>>(await file.text(), { header: true, skipEmptyLines: true, dynamicTyping: true });
  if (res.errors.length && res.data.length === 0) throw new Error(`Couldn't parse CSV: ${res.errors[0].message}`);
  return res.data;
}

async function parseJsonRows(file: File): Promise<Record<string, unknown[]>> {
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error("This file isn't valid JSON.");
  }
  if (Array.isArray(data)) return { Sheet1: data };
  if (data && typeof data === "object" && Object.values(data).every(Array.isArray)) {
    return data as Record<string, unknown[]>; // { sheetName: rows[] } (what xlsx→json emits)
  }
  throw new Error("JSON must be an array of objects (or an object of arrays) to convert to a table.");
}

// ---------- HTML / PDF helpers ----------

const HTML_SHELL = (body: string, title: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title.replace(/</g, "&lt;")}</title>` +
  `<style>body{font:16px/1.6 system-ui,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem}pre,code{background:#f4f4f5;border-radius:4px}pre{padding:1rem;overflow:auto}code{padding:.1em .3em}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:.4em .7em}img{max-width:100%}blockquote{border-left:3px solid #ccc;margin-left:0;padding-left:1rem;color:#555}</style>` +
  `</head><body>${body}</body></html>`;

async function sanitize(html: string) {
  const { default: DOMPurify } = await import("dompurify");
  return DOMPurify.sanitize(html);
}

/** Render sanitized HTML into a paginated PDF (jsPDF + html2canvas, fully client-side). */
async function htmlToPdf(html: string, s: DocSettings): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:794px;background:#fff;color:#000;font:${s.fontSize + 3}px/1.5 system-ui,sans-serif`;
  host.innerHTML = await sanitize(html);
  document.body.appendChild(host);
  try {
    const pdf = new jsPDF({ unit: "mm", format: s.pageSize, orientation: s.orientation });
    const pageW = pdf.internal.pageSize.getWidth();
    await pdf.html(host, {
      margin: [s.marginMm, s.marginMm, s.marginMm, s.marginMm],
      width: pageW - s.marginMm * 2,
      windowWidth: 794,
      autoPaging: "text",
    });
    return pdf.output("blob");
  } finally {
    host.remove();
  }
}

async function textToPdf(text: string, s: DocSettings): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: s.pageSize, orientation: s.orientation });
  const w = pdf.internal.pageSize.getWidth() - s.marginMm * 2;
  const h = pdf.internal.pageSize.getHeight() - s.marginMm * 2;
  const lineH = s.fontSize * 0.3528 * 1.4; // pt → mm × leading
  pdf.setFontSize(s.fontSize);
  const lines: string[] = pdf.splitTextToSize(text, w);
  let y = s.marginMm + lineH;
  for (const line of lines) {
    if (y > s.marginMm + h) {
      pdf.addPage();
      y = s.marginMm + lineH;
    }
    pdf.text(line, s.marginMm, y);
    y += lineH;
  }
  return pdf.output("blob");
}

async function textToDocx(text: string): Promise<Blob> {
  const { Document, Packer, Paragraph } = await import("docx");
  const doc = new Document({
    sections: [{ children: text.split(/\r?\n/).map((l) => new Paragraph(l)) }],
  });
  return Packer.toBlob(doc);
}

async function imageToPdf(file: File, s: DocSettings): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const src = detectFormat(file)?.id;
  let img;
  if (src === "jpg") img = await pdf.embedJpg(new Uint8Array(await file.arrayBuffer()));
  else if (src === "png") img = await pdf.embedPng(new Uint8Array(await file.arrayBuffer()));
  else {
    // webp/avif/bmp/gif → decode via canvas, re-embed as PNG
    const canvas = await fileToCanvas(file);
    img = await pdf.embedPng(new Uint8Array(await (await canvasToBlob(canvas, "image/png")).arrayBuffer()));
  }
  // Fit the image onto a standard page (keeping aspect), honouring margins/orientation.
  const [pw, ph] = s.pageSize === "a4" ? [595.28, 841.89] : [612, 792];
  const landscape = s.orientation === "landscape" || (s.orientation === "portrait" && img.width > img.height * 1.3);
  const [W, H] = landscape ? [ph, pw] : [pw, ph];
  const m = s.marginMm * 2.835;
  const scale = Math.min((W - 2 * m) / img.width, (H - 2 * m) / img.height, 1);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const page = pdf.addPage([W, H]);
  page.drawImage(img, { x: (W - dw) / 2, y: (H - dh) / 2, width: dw, height: dh });
  return new Blob([(await pdf.save()) as BlobPart], { type: "application/pdf" });
}

// ---------- dispatcher ----------

export const convertDocument: Converter = async (file, targetId, { settings, onProgress }) => {
  const src = detectFormat(file)?.id;
  const s = settings.document;
  if (!src) throw new Error("Unsupported file type.");
  onProgress(10);

  const pair = `${src}>${targetId}`;
  let out: Blob;

  switch (pair) {
    // spreadsheets / data
    case "csv>json":
      out = jsonBlob(await parseCsv(file));
      break;
    case "csv>xlsx": {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(await parseCsv(file)), "Sheet1");
      out = new Blob([XLSX.write(wb, { type: "array", bookType: "xlsx" })], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      break;
    }
    case "xlsx>csv":
    case "xls>csv": {
      const { XLSX, wb } = await readSheets(file);
      out = textBlob(XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]), "text/csv");
      break;
    }
    case "xlsx>json":
    case "xls>json": {
      const { XLSX, wb } = await readSheets(file);
      const rows = Object.fromEntries(wb.SheetNames.map((n) => [n, XLSX.utils.sheet_to_json(wb.Sheets[n])]));
      out = jsonBlob(wb.SheetNames.length === 1 ? rows[wb.SheetNames[0]] : rows);
      break;
    }
    case "xls>xlsx": {
      const { XLSX, wb } = await readSheets(file);
      out = new Blob([XLSX.write(wb, { type: "array", bookType: "xlsx" })], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      break;
    }
    case "json>csv": {
      const Papa = (await import("papaparse")).default;
      const sheets = await parseJsonRows(file);
      const first = Object.values(sheets)[0] ?? [];
      out = textBlob(Papa.unparse(first as object[]), "text/csv");
      break;
    }
    case "json>xlsx": {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      for (const [name, rows] of Object.entries(await parseJsonRows(file))) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows as object[]), name.slice(0, 31));
      }
      out = new Blob([XLSX.write(wb, { type: "array", bookType: "xlsx" })], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      break;
    }

    // markdown
    case "md>html": {
      const { marked } = await import("marked");
      out = textBlob(HTML_SHELL(await sanitize(await marked.parse(await file.text())), file.name), "text/html");
      break;
    }
    case "md>pdf": {
      const { marked } = await import("marked");
      out = await htmlToPdf(await marked.parse(await file.text()), s);
      break;
    }

    // word / text
    case "docx>txt": {
      const mammoth = await import("mammoth");
      out = textBlob((await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value, "text/plain");
      break;
    }
    case "docx>html": {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
      out = textBlob(HTML_SHELL(await sanitize(value), file.name), "text/html");
      break;
    }
    case "docx>pdf": {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
      out = await htmlToPdf(value, s);
      break;
    }
    case "txt>pdf":
      out = await textToPdf(await file.text(), s);
      break;
    case "txt>docx":
      out = await textToDocx(await file.text());
      break;

    default:
      if (targetId === "pdf" && ["jpg", "png", "webp", "avif", "bmp", "gif"].includes(src)) {
        out = await imageToPdf(file, s);
        break;
      }
      throw new Error(`Converting ${src.toUpperCase()} to ${targetId.toUpperCase()} isn't supported.`);
  }

  onProgress(100);
  return out;
};
