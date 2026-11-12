import multer from "multer";
import { error } from "../utils/responseFormatter.js";
import { FILE_LIMITS_MB } from "../utils/media.js";

export const notFound = (req, res) =>
  error(res, { message: `Route ${req.method} ${req.originalUrl} tidak ditemukan`, statusCode: 404 });

export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const map = {
      LIMIT_FILE_SIZE: `Ukuran file terlalu besar (maksimal: gambar ${FILE_LIMITS_MB.image} MB, audio ${FILE_LIMITS_MB.audio} MB, video ${FILE_LIMITS_MB.video} MB)`,
      LIMIT_FILE_COUNT: "Jumlah file maksimal 5",
      LIMIT_UNEXPECTED_FILE: 'File harus dikirim lewat field "images" dengan jumlah maksimal 5',
    };
    return error(res, { message: map[err.code] || err.message, statusCode: 400 });
  }

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return error(res, { message: "Validasi gagal", statusCode: 422, errors });
  }

  if (err.name === "CastError") {
    return error(res, { message: `Nilai ${err.path} tidak valid`, statusCode: 400 });
  }

  if (err.code === 11000) {
    return error(res, { message: "Data sudah terdaftar", statusCode: 409 });
  }

  console.error(err);
  return error(res, {
    message: err.message || "Terjadi kesalahan pada server",
    statusCode: err.statusCode || 500,
  });
};
