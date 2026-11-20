"use client";

import { useCallback, useEffect, useState } from "react";
import { convertMedia, getMediaCapability, loadFFmpeg, type MediaCapability } from "@/lib/converters/media";
import type { Converter } from "@/lib/queue/types";

export type EngineStatus = "idle" | "loading" | "ready" | "unsupported" | "error";

/** ffmpeg.wasm engine (runs in its own Web Worker) with load status + SharedArrayBuffer awareness. */
export function useMediaConverter() {
  const [status, setStatus] = useState<EngineStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [capability, setCapability] = useState<MediaCapability | null>(null);

  // evaluate after mount (crossOriginIsolated doesn't exist during SSR)
  useEffect(() => {
    const cap = getMediaCapability();
    setCapability(cap);
    if (!cap.supported) setStatus("unsupported");
  }, []);

  /** Warm the ~30 MB wasm core (e.g. when a video file is dropped) so Convert starts instantly. */
  const preload = useCallback(async () => {
    const cap = getMediaCapability();
    if (!cap.supported) return setStatus("unsupported");
    setStatus("loading");
    try {
      await loadFFmpeg();
      setStatus("ready");
      setError(null);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const convert = useCallback<Converter>(
    async (file, target, ctx) => {
      setStatus((s) => (s === "ready" ? s : "loading"));
      try {
        const out = await convertMedia(file, target, ctx);
        setStatus("ready");
        setError(null);
        return out;
      } catch (e) {
        if (!ctx.signal.aborted) {
          setError(e instanceof Error ? e.message : String(e));
          setStatus(getMediaCapability().supported ? "error" : "unsupported");
        } else {
          setStatus("idle"); // aborting terminates the worker; it reloads on next use
        }
        throw e;
      }
    },
    [],
  );

  return { convert, preload, status, error, capability };
}
