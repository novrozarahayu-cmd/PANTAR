// Jenis file yang boleh diunggah lewat field "images": gambar, audio, dan video.
// Tanpa dependensi eksternal agar mudah diuji.
//
// Hanya gambar JPG/PNG/WebP yang dikirim ke AI dan dianalisis (hash, EXIF). Audio dan video
// hanya diunggah ke Cloudinary dan disimpan di array `images` yang sama (resource_type
// "video" untuk audio maupun video, sesuai perilaku Cloudinary), jadi model tidak berubah.

const MB = 1024 * 1024;
const mbFromEnv = (name, fallback) => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// Batas ukuran per jenis (MB). Bisa diubah lewat .env.
export const FILE_LIMITS_MB = {
  image: mbFromEnv("UPLOAD_MAX_IMAGE_MB", 5),
  audio: mbFromEnv("UPLOAD_MAX_AUDIO_MB", 10),
  video: mbFromEnv("UPLOAD_MAX_VIDEO_MB", 25),
};
export const FILE_LIMITS = {
  image: FILE_LIMITS_MB.image * MB,
  audio: FILE_LIMITS_MB.audio * MB,
  video: FILE_LIMITS_MB.video * MB,
};
// Batas kasar untuk multer (ukuran terbesar); batas per jenis dicek di verifyMediaFiles.
export const MAX_UPLOAD_BYTES = Math.max(...Object.values(FILE_LIMITS));

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
  "audio/flac",
  "audio/x-flac",
];
export const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/3gpp",
  "video/webm",
  "video/x-matroska",
  "video/x-msvideo",
];
export const ALLOWED_MIME_TYPES = [...IMAGE_MIME_TYPES, ...AUDIO_MIME_TYPES, ...VIDEO_MIME_TYPES];

// Hanya format ini yang dianalisis AI / forensik gambar.
export const AI_IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp"];

/** Buang parameter ("audio/webm;codecs=opus" -> "audio/webm") dan samakan huruf kecil. */
export const normalizeMime = (mime) => String(mime ?? "").split(";")[0].trim().toLowerCase();

export const isAllowedMime = (mime) => ALLOWED_MIME_TYPES.includes(normalizeMime(mime));

/** "image" | "audio" | "video" | null berdasarkan mimetype. */
export const mediaKind = (mime) => {
  const m = normalizeMime(mime);
  if (IMAGE_MIME_TYPES.includes(m)) return "image";
  if (AUDIO_MIME_TYPES.includes(m)) return "audio";
  if (VIDEO_MIME_TYPES.includes(m)) return "video";
  return null;
};

const ascii = (buf, start, end) => buf.toString("latin1", start, end);

// Brand ftyp untuk gambar HEIC/AVIF: container-nya sama dengan MP4 tetapi BUKAN video.
const IMAGE_FTYP_BRANDS = ["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1", "avif", "avis"];

/** Deteksi tipe gambar dari magic bytes. Mimetype dari klien mudah dipalsukan. */
export const detectImageType = (buf) => {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (ascii(buf, 0, 4) === "RIFF" && ascii(buf, 8, 12) === "WEBP") return "image/webp";
  return null;
};

/**
 * Deteksi gambar/audio/video dari magic bytes.
 * @param {Buffer} buf isi file
 * @param {string} declaredMime mimetype kiriman klien; hanya dipakai untuk membedakan container
 *   yang bisa berisi audio maupun video (mp4/m4a, webm). Isi file tetap penentu utama.
 * @returns {{ kind: "image"|"audio"|"video", mimetype: string } | null}
 */
export const detectMediaType = (buf, declaredMime = "") => {
  if (!buf || buf.length < 12) return null;
  const declaredKind = mediaKind(declaredMime);
  const hit = (mimetype) => ({ kind: mediaKind(mimetype), mimetype });

  const image = detectImageType(buf);
  if (image) return hit(image);

  const head4 = ascii(buf, 0, 4);

  // RIFF: WAV (audio) atau AVI (video). WebP sudah ditangani di atas.
  if (head4 === "RIFF") {
    const form = ascii(buf, 8, 12);
    if (form === "WAVE") return hit("audio/wav");
    if (form === "AVI ") return hit("video/x-msvideo");
    return null;
  }

  // MP3: tag ID3 atau frame sync. AAC (ADTS): sync dengan bit layer 00.
  if (head4.startsWith("ID3")) return hit("audio/mpeg");
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) {
    const layer = (buf[1] >> 1) & 0x03;
    const version = (buf[1] >> 3) & 0x03;
    if (layer === 0) return (buf[1] & 0xf6) === 0xf0 ? hit("audio/aac") : null;
    if (version !== 1) return hit("audio/mpeg");
    return null;
  }

  if (head4 === "OggS") return hit("audio/ogg");
  if (head4 === "fLaC") return hit("audio/flac");

  // EBML: WebM atau Matroska (bisa audio atau video).
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    if (normalizeMime(declaredMime) === "video/x-matroska") return hit("video/x-matroska");
    return hit(declaredKind === "audio" ? "audio/webm" : "video/webm");
  }

  // ISO base media (MP4, M4A, MOV, 3GP): "ftyp" di offset 4, brand di offset 8.
  if (ascii(buf, 4, 8) === "ftyp") {
    const brand = ascii(buf, 8, 12);
    if (IMAGE_FTYP_BRANDS.includes(brand)) return null;
    if (brand === "qt  ") return hit("video/quicktime");
    if (brand === "M4A " || brand === "M4B ") return hit("audio/mp4");
    if (brand.startsWith("3g")) return hit("video/3gpp");
    return hit(declaredKind === "audio" ? "audio/mp4" : "video/mp4");
  }

  return null;
};

/** Apakah mimetype ini gambar yang boleh dianalisis AI/forensik (JPG, PNG, WebP). */
export const isAiImageMime = (mime) => IMAGE_MIME_TYPES.includes(normalizeMime(mime));

/**
 * Apakah entri `images` pada dokumen (objek hasil Cloudinary) adalah gambar JPG/PNG/WebP.
 * Dokumen lama tanpa resource_type/format dianggap gambar.
 */
export const isAiImage = (img) => {
  if (!img || typeof img !== "object") return false;
  if ((img.resource_type ?? "image") !== "image") return false;
  return !img.format || AI_IMAGE_FORMATS.includes(String(img.format).toLowerCase());
};