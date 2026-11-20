import { ImageResponse } from "next/og";

export const alt = "LocalConvert — free private file converter & compressor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social share card (also used as the Twitter card image). Generated at build time. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="96" height="96" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14" fill="#ffffff" />
            <g transform="translate(14 14) scale(1.5)" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" />
            </g>
          </svg>
          <div style={{ fontSize: 64, fontWeight: 800 }}>LocalConvert</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 52, fontWeight: 700, lineHeight: 1.15 }}>Free file converter &amp; compressor</div>
        <div style={{ marginTop: 20, fontSize: 32, opacity: 0.9 }}>Images, Video, Audio, PDF, Docs, Spreadsheets</div>
        <div style={{ marginTop: 40, fontSize: 30, display: "flex", padding: "10px 24px", background: "rgba(255,255,255,0.18)", borderRadius: 999, alignSelf: "flex-start" }}>100% private. Files never leave your device.</div>
      </div>
    ),
    size,
  );
}
