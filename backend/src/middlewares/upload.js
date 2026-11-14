import multer from "multer";
import {
  FILE_LIMITS,
  FILE_LIMITS_MB,
  MAX_UPLOAD_BYTES,
  detectMediaType,
  isAllowedMime,
  normalizeMime,
} from "../utils/media.js";

// Nama konstanta dipertahankan karena dipakai controller (batas jumlah file per laporan/progres).
export const MAX_IMAGES = 5;

const KIND_LABEL = { image: "gambar", audio: "audio", video: "video" };

// Mimetype kiriman klien hanya penyaring awal. Tipe asli diverifikasi ulang lewat magic bytes
// di verifyMediaFiles, jadi file lain yang mimetype-nya dipalsukan tetap ditolak.
const fileFilter = (_req, file, cb) => {
  if (isAllowedMime(file.mimetype)) {
    return cb(null, true);
  }

  const error = new Error(
    `Format file tidak didukung: ${file.mimetype}. Yang diizinkan: gambar (JPG, PNG, WebP), ` +
      `audio (MP3, WAV, OGG, M4A/AAC, FLAC, WebM), atau video (MP4, MOV, 3GP, WebM, MKV, AVI).`
  );
  error.statusCode = 400;
  return cb(error);
};

// Field tetap "images" agar klien dan model tidak berubah, walau isinya bisa audio/video.
const createMediaUploader = () =>
  multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
      fileSize: MAX_UPLOAD_BYTES, // batas kasar; batas per jenis dicek di verifyMediaFiles
      files: MAX_IMAGES,
    },
  }).array("images", MAX_IMAGES);

export const uploadReportImages = createMediaUploader();
export const uploadProgressImages = createMediaUploader();

/**
 * Pasang setelah multer. Memastikan isi file benar-benar gambar/audio/video yang diizinkan
 * (bukan file lain yang mimetype-nya dipalsukan), menyetel mimetype sesuai isi file, dan
 * memeriksa batas ukuran per jenis.
 */
export const verifyMediaFiles = (req, res, next) => {
  for (const file of req.files ?? []) {
    const real = detectMediaType(file.buffer, normalizeMime(file.mimetype));
    if (!real) {
      return res.status(400).json({
        success: false,
        message: `File "${file.originalname}" bukan gambar (JPG, PNG, WebP), audio, atau video yang valid`,
      });
    }

    if (file.buffer.length > FILE_LIMITS[real.kind]) {
      return res.status(400).json({
        success: false,
        message: `File "${file.originalname}" terlalu besar. Maksimal ${FILE_LIMITS_MB[real.kind]} MB untuk ${KIND_LABEL[real.kind]}`,
      });
    }

    file.mimetype = real.mimetype;
  }
  next();
};