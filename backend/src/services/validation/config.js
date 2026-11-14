// Konfigurasi validasi laporan. Semua nilai bisa diubah lewat .env (lihat .env.example).
const num = (v, d) => {
  if (v === undefined || v === "") return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const list = (v, d) =>
  (v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .concat(v ? [] : d);

const DEFAULT_MODELS = [
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3.5-super-vl:free",
];

const apiKey = process.env.OPENROUTER_API_KEY || "";

export const VCFG = {
  // Skor
  baseScore: num(process.env.VALIDATION_BASE_SCORE, 50),
  autoVerifyMin: num(process.env.VALIDATION_AUTO_VERIFY_MIN, 70),
  reviewMin: num(process.env.VALIDATION_REVIEW_MIN, 40),

  // Duplikat
  dupRadiusImageM: num(process.env.VALIDATION_DUP_IMAGE_RADIUS_M, 150),
  dupRadiusNearM: num(process.env.VALIDATION_DUP_NEAR_RADIUS_M, 25),
  dupDays: num(process.env.VALIDATION_DUP_DAYS, 30),
  phashMaxDistance: num(process.env.VALIDATION_PHASH_MAX_DISTANCE, 6), // maks 7 (batas pigeonhole 8 chunk)

  // EXIF (opsional: foto tanpa EXIF tidak dihukum)
  exifMatchM: num(process.env.VALIDATION_EXIF_MATCH_M, 150),
  exifMismatchM: num(process.env.VALIDATION_EXIF_MISMATCH_M, 500),
  photoFreshHours: num(process.env.VALIDATION_PHOTO_FRESH_HOURS, 72),
  photoOldDays: num(process.env.VALIDATION_PHOTO_OLD_DAYS, 30),
  exifDefaultOffset: process.env.VALIDATION_EXIF_DEFAULT_OFFSET || "+07:00",

  // Posisi titik terhadap jalan (OSRM nearest), hanya untuk type "jalan"
  roadCheckEnabled: process.env.VALIDATION_ROAD_CHECK !== "false",
  roadMaxM: num(process.env.VALIDATION_ROAD_MAX_M, 60),
  roadTimeoutMs: num(process.env.VALIDATION_ROAD_TIMEOUT_MS, 2500),

  minImageSide: num(process.env.VALIDATION_MIN_IMAGE_SIDE, 240),

  // Batas kiriman per IP / device per jam (anti-spam)
  maxPerHour: num(process.env.VALIDATION_MAX_PER_HOUR, 10),

  // AI vision via OpenRouter
  ai: {
    apiKey,
    enabled: process.env.AI_VALIDATION_ENABLED !== "false" && !!apiKey,
    models: list(process.env.AI_VISION_MODELS, DEFAULT_MODELS),
    timeoutMs: num(process.env.AI_TIMEOUT_MS, 25000),
    maxImages: num(process.env.AI_MAX_IMAGES, 2),
    maxAttempts: num(process.env.AI_MAX_ATTEMPTS, 3),
    minConfidence: num(process.env.AI_MIN_CONFIDENCE, 0.6),
    minGapMs: num(process.env.AI_MIN_GAP_MS, 3000),
    staleLockMs: 5 * 60 * 1000,
    // "inline"     : AI dijalankan sebelum response dikirim (lambat)
    // "background" : AI dijalankan setelah response (server yang terus hidup)
    // "queue"      : hanya ditandai pending, diproses via POST/GET /api/validation/process (Vercel)
    mode: process.env.AI_VALIDATION_MODE || (process.env.VERCEL ? "queue" : "background"),
  },
};
