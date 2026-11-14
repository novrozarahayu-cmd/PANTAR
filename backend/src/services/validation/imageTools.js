import crypto from "crypto";
import sharp from "sharp";
import { extractExif } from "./exif.js";

// Deteksi tipe gambar dari magic bytes ada di utils/media.js (bersama deteksi audio/video).
export { detectImageType } from "../../utils/media.js";
export const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

/** dHash 64-bit (hex 16 karakter). Tahan terhadap resize, kompresi, dan perubahan warna kecil. */
export const dHash = async (buf) => {
  const px = await sharp(buf)
    .rotate()
    .resize(9, 8, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer();
  let bits = "";
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) bits += px[y * 9 + x] > px[y * 9 + x + 1] ? "1" : "0";
  }
  let hex = "";
  for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  return hex;
};

export const hamming = (a, b) => {
  if (!a || !b || a.length !== b.length) return 64;
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let n = 0;
  while (x) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
};

/**
 * Pecah hash 64-bit jadi 8 chunk bertanda posisi. Jika jarak Hamming <= 7, minimal satu chunk
 * identik (prinsip pigeonhole), jadi pencarian foto mirip cukup memakai $in pada indeks chunk
 * lalu jarak dihitung persis. Skalabel untuk ribuan laporan tanpa memindai seluruh koleksi.
 */
export const hashChunks = (hex) => Array.from({ length: 8 }, (_, i) => `${i}:${hex.slice(i * 2, i * 2 + 2)}`);

/** Analisis satu file gambar dari buffer: hash, dimensi, EXIF. Tidak pernah melempar error. */
export const analyzeImage = async (buf) => {
  const out = { sha256: sha256(buf), phash: null, phashChunks: [], width: null, height: null, exif: null };
  try {
    const meta = await sharp(buf).metadata();
    out.width = meta.width ?? null;
    out.height = meta.height ?? null;
    out.phash = await dHash(buf);
    out.phashChunks = hashChunks(out.phash);
  } catch {
    /* gambar rusak: biarkan kosong, dicatat sebagai pemeriksaan di rules */
  }
  const ex = await extractExif(buf);
  out.exif = {
    hasGps: !!ex.gps,
    lat: ex.gps?.lat ?? null,
    lng: ex.gps?.lng ?? null,
    takenAt: ex.takenAt,
    software: ex.software,
    make: ex.make,
    model: ex.model,
  };
  return out;
};

/** Unduh gambar (URL Cloudinary dari database kita), batasi ukuran dan waktu. */
export const fetchImageBuffer = async (url, { timeoutMs = 10000, maxBytes = 10 * 1024 * 1024 } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Unduh gambar gagal: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > maxBytes) throw new Error("Gambar terlalu besar");
    return buf;
  } finally {
    clearTimeout(timer);
  }
};

/** Perkecil gambar untuk AI (hemat token dan waktu), kembalikan data URL JPEG. */
export const toAiDataUrl = async (buf, maxSide = 768) => {
  const out = await sharp(buf)
    .rotate()
    .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 72 })
    .toBuffer();
  return `data:image/jpeg;base64,${out.toString("base64")}`;
};
