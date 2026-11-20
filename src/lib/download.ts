export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Keep the URL alive long enough for slow starts (e.g. a "Save as" prompt) before freeing memory.
  setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
}

/** Zip finished outputs. Duplicate names get " (2)", " (3)"… suffixes. */
export async function zipOutputs(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const seen = new Map<string, number>();
  for (const { name, blob } of files) {
    const n = (seen.get(name) ?? 0) + 1;
    seen.set(name, n);
    const dot = name.lastIndexOf(".");
    const unique = n === 1 ? name : `${dot > 0 ? name.slice(0, dot) : name} (${n})${dot > 0 ? name.slice(dot) : ""}`;
    zip.file(unique, blob);
  }
  // STORE: outputs are mostly already-compressed media/PDF, so deflate just burns CPU.
  return zip.generateAsync({ type: "blob", compression: "STORE" });
}
