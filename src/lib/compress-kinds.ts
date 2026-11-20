export interface CompressKind {
  slug: string;
  title: string; // "Compress JPG"
  h1: string;
  blurb: string;
  how: string; // what actually happens to this type of file
}

export const COMPRESS_KINDS: CompressKind[] = [
  { slug: "image", title: "Image Compressor", h1: "Compress images", blurb: "Shrink JPG, PNG, WEBP, AVIF, GIF and BMP files.", how: "Images are re-encoded at a lower quality and, at higher levels, scaled down to a sensible maximum size. Aspect ratio is kept and images are never enlarged." },
  { slug: "jpg", title: "JPG Compressor", h1: "Compress JPG", blurb: "Make JPG photos much smaller with little visible loss.", how: "The JPG is re-encoded at a lower quality, and large photos are scaled down at the Balanced and Strong levels." },
  { slug: "png", title: "PNG Compressor", h1: "Compress PNG", blurb: "Reduce PNG file size right in your browser.", how: "PNG is lossless, so savings come mostly from scaling very large images down. Screenshots and small graphics may already be near-optimal." },
  { slug: "gif", title: "GIF Compressor", h1: "Compress GIF", blurb: "Shrink animated GIFs by lowering frame rate and size.", how: "The animation is re-rendered with a lower frame rate and width, with an optimized palette." },
  { slug: "video", title: "Video Compressor", h1: "Compress video", blurb: "Reduce MP4, MOV, WEBM, AVI and MKV file size.", how: "The video is re-encoded with a higher compression setting and, at Balanced/Strong, scaled down to 720p/480p. Large videos use a lot of browser memory." },
  { slug: "mp4", title: "MP4 Compressor", h1: "Compress MP4", blurb: "Make MP4 videos smaller for email and sharing.", how: "The MP4 is re-encoded with H.264 at a higher compression level, optionally scaled down." },
  { slug: "audio", title: "Audio Compressor", h1: "Compress audio", blurb: "Shrink MP3, WAV, FLAC, AAC, M4A and OGG files.", how: "Audio is re-encoded at a lower bitrate. WAV and FLAC become MP3, which is typically 80–90% smaller." },
  { slug: "mp3", title: "MP3 Compressor", h1: "Compress MP3", blurb: "Lower the bitrate of MP3 files to save space.", how: "The MP3 is re-encoded at 192, 128 or 96 kbps depending on the level you choose." },
  { slug: "pdf", title: "PDF Compressor", h1: "Compress PDF", blurb: "Optimize the structure of PDF files.", how: "The PDF is rewritten with compressed object streams and unused data removed. Scanned or image-heavy PDFs shrink only slightly." },
  { slug: "word", title: "Word (DOCX) Compressor", h1: "Compress Word documents", blurb: "Shrink DOCX files full of pictures.", how: "Images embedded in the document are re-compressed and the package is re-zipped at maximum compression." },
  { slug: "excel", title: "Excel (XLSX) Compressor", h1: "Compress Excel files", blurb: "Reduce the size of XLSX workbooks.", how: "The workbook package is re-zipped at maximum compression and any embedded pictures are re-compressed." },
  { slug: "files", title: "File Compressor", h1: "Compress any file", blurb: "Shrink text, CSV, JSON and other files into a ZIP.", how: "Files without a specialised method are packed into a ZIP with maximum DEFLATE compression. Already-compressed files are returned unchanged." },
];

export const getKind = (slug: string) => COMPRESS_KINDS.find((k) => k.slug === slug);
