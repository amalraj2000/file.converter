import type { NextConfig } from "next";

/**
 * Cross-origin isolation headers: required for SharedArrayBuffer (multi-threaded wasm).
 * COEP `require-corp` means EVERY subresource must be same-origin or send CORP/CORS
 * headers, so this app self-hosts fonts/scripts and never embeds third-party assets.
 */
const isolationHeaders = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: isolationHeaders },
      {
        // ffmpeg core/wasm are large and versioned by package version → cache hard.
        source: "/ffmpeg/:file*",
        headers: [
          ...isolationHeaders,
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
