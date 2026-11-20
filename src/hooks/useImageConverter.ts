"use client";

import { useEffect, useState } from "react";
import { canEncodeAvif, convertImage } from "@/lib/converters/image";

/** Canvas + browser-image-compression engine. `convert` has a stable identity. */
export function useImageConverter() {
  // null = still probing. Lets the UI warn before the user picks AVIF in a browser that can't encode it.
  const [avifSupported, setAvifSupported] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    canEncodeAvif().then((ok) => live && setAvifSupported(ok));
    return () => {
      live = false;
    };
  }, []);

  return { convert: convertImage, avifSupported };
}
