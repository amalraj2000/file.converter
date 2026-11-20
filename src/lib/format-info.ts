export interface FormatInfo {
  full: string;
  about: string;
  lossy?: boolean;
  bestFor: string;
}

/** Hand-written facts used to give every /convert page genuinely unique, useful content. */
export const FORMAT_INFO: Record<string, FormatInfo> = {
  jpg: { full: "JPEG image", lossy: true, about: "JPG is the most widely supported photo format. It uses lossy compression to keep photographs small, but it has no transparency.", bestFor: "photos, web images and email attachments" },
  png: { full: "Portable Network Graphics", lossy: false, about: "PNG is a lossless image format with full transparency support, ideal for screenshots, logos and graphics with sharp edges.", bestFor: "screenshots, logos and images that need transparency" },
  webp: { full: "WebP image", lossy: true, about: "WebP is a modern image format from Google that is typically 25–35% smaller than JPG or PNG at similar quality, with transparency and animation support.", bestFor: "fast-loading websites" },
  avif: { full: "AV1 Image File Format", lossy: true, about: "AVIF is a next-generation image format that often beats WebP and JPG on file size at the same visual quality. Support is growing but not universal.", bestFor: "the smallest possible web images" },
  bmp: { full: "Bitmap image", lossy: false, about: "BMP stores raw, uncompressed pixels, so files are large but simple and universally readable by older software.", bestFor: "legacy software and simple pixel data" },
  ico: { full: "Windows icon", lossy: false, about: "ICO is the icon format used for favicons and Windows application icons, holding one or more small square images.", bestFor: "website favicons and app icons" },
  gif: { full: "Graphics Interchange Format", lossy: true, about: "GIF supports short looping animations with a limited 256-color palette. Files are large compared with modern video formats.", bestFor: "short looping animations and memes" },
  mp4: { full: "MPEG-4 video", lossy: true, about: "MP4 (H.264) is the most compatible video format, playing on virtually every phone, browser and TV.", bestFor: "sharing and streaming video everywhere" },
  webm: { full: "WebM video", lossy: true, about: "WebM is an open video format designed for the web, well supported in Chrome, Firefox and Edge.", bestFor: "web video and open-source workflows" },
  mov: { full: "QuickTime movie", lossy: true, about: "MOV is Apple's QuickTime container, common for iPhone and Mac recordings and professional editing.", bestFor: "Apple devices and video editing" },
  avi: { full: "Audio Video Interleave", lossy: true, about: "AVI is an older Microsoft video container that is widely readable but produces larger files than modern formats.", bestFor: "older players and legacy editing software" },
  mkv: { full: "Matroska video", lossy: true, about: "MKV is a flexible container that can hold many video, audio and subtitle tracks, popular for downloaded movies.", bestFor: "movies with multiple audio or subtitle tracks" },
  mp3: { full: "MPEG audio layer III", lossy: true, about: "MP3 is the universal audio format, compressing music to a fraction of its original size with small quality loss.", bestFor: "music and podcasts on any device" },
  wav: { full: "Waveform audio", lossy: false, about: "WAV stores uncompressed audio at full quality, which makes it large but ideal for editing and production.", bestFor: "audio editing and archiving" },
  aac: { full: "Advanced Audio Coding", lossy: true, about: "AAC delivers better sound than MP3 at the same bitrate and is the default audio for Apple devices and YouTube.", bestFor: "streaming and mobile audio" },
  ogg: { full: "Ogg Vorbis audio", lossy: true, about: "OGG Vorbis is a free, open audio format with good quality-per-size, common in games and open-source software.", bestFor: "games and open-source projects" },
  m4a: { full: "MPEG-4 audio", lossy: true, about: "M4A is AAC audio in an MP4 container, used for iTunes purchases and voice memos.", bestFor: "Apple music and voice recordings" },
  flac: { full: "Free Lossless Audio Codec", lossy: false, about: "FLAC compresses audio without any quality loss, typically to about half the size of WAV.", bestFor: "high-quality music libraries" },
  pdf: { full: "Portable Document Format", lossy: false, about: "PDF preserves layout exactly across devices, which makes it the standard for sharing and printing documents.", bestFor: "sharing and printing documents" },
  docx: { full: "Microsoft Word document", lossy: false, about: "DOCX is the Word document format, holding formatted text, images and tables in a compressed package.", bestFor: "editable formatted documents" },
  xlsx: { full: "Microsoft Excel workbook", lossy: false, about: "XLSX is the Excel spreadsheet format, supporting multiple sheets, formulas and formatting.", bestFor: "spreadsheets with formulas and formatting" },
  xls: { full: "Legacy Excel workbook", lossy: false, about: "XLS is the older binary Excel format used before 2007; many tools still export it.", bestFor: "opening spreadsheets from older software" },
  csv: { full: "Comma-separated values", lossy: false, about: "CSV is a plain-text table format that nearly every spreadsheet, database and programming language can read.", bestFor: "moving tabular data between systems" },
  json: { full: "JavaScript Object Notation", lossy: false, about: "JSON is a lightweight text format for structured data, the standard for web APIs and configuration files.", bestFor: "APIs, apps and structured data" },
  md: { full: "Markdown", lossy: false, about: "Markdown is a simple plain-text syntax for formatted writing, used in documentation, READMEs and notes.", bestFor: "documentation and note-taking" },
  html: { full: "HyperText Markup Language", lossy: false, about: "HTML is the language of web pages, readable in any browser.", bestFor: "publishing content on the web" },
  txt: { full: "Plain text", lossy: false, about: "TXT contains unformatted text with no styling, readable by every device and editor.", bestFor: "simple notes and maximum compatibility" },
};
