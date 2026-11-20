// Copies the ffmpeg.wasm core + worker chunks into /public/ffmpeg so they are served
// same-origin. Same-origin matters: with COEP `require-corp`, cross-origin CDN files
// would need CORP headers, and self-hosting avoids that failure mode entirely.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "ffmpeg");
mkdirSync(out, { recursive: true });

const sources = [
  join(root, "node_modules", "@ffmpeg", "core", "dist", "esm"),
  join(root, "node_modules", "@ffmpeg", "ffmpeg", "dist", "umd"),
];

let copied = 0;
for (const dir of sources) {
  if (!existsSync(dir)) {
    console.warn(`[copy-ffmpeg] missing ${dir} (skipping)`);
    continue;
  }
  for (const f of readdirSync(dir)) {
    if (/\.(js|wasm)$/.test(f)) {
      cpSync(join(dir, f), join(out, f));
      copied++;
    }
  }
}
console.log(`[copy-ffmpeg] copied ${copied} files to public/ffmpeg`);
