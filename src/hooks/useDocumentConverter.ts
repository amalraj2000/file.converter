"use client";

import { convertDocument } from "@/lib/converters/document";

/**
 * Documents, spreadsheets & text (xlsx, papaparse, mammoth, docx, pdf-lib, jspdf, marked).
 * Each library is dynamically imported on first use, so none of it is in the initial bundle.
 */
export function useDocumentConverter() {
  return { convert: convertDocument };
}
