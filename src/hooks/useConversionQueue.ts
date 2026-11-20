"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { compressFile } from "@/lib/converters/compress";
import { ConversionQueue } from "@/lib/queue/queue-manager";
import { useDocumentConverter } from "./useDocumentConverter";
import { useImageConverter } from "./useImageConverter";
import { useMediaConverter } from "./useMediaConverter";

/** Wires the three engine hooks into one queue and exposes its reactive state. */
export function useConversionQueue() {
  const image = useImageConverter();
  const media = useMediaConverter();
  const document = useDocumentConverter();

  // Queue is created once; converters are read lazily so it always sees the latest ones.
  const converters = useRef({ image: image.convert, media: media.convert, document: document.convert, compress: compressFile });
  converters.current = { image: image.convert, media: media.convert, document: document.convert, compress: compressFile };
  const [queue] = useState(() => new ConversionQueue(() => converters.current));

  const state = useSyncExternalStore(queue.subscribe, queue.getSnapshot, queue.getSnapshot);
  return { queue, state, media, image };
}
