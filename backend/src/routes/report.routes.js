import { Router } from "express";
import { uploadReportImages, verifyMediaFiles } from "../middlewares/upload.js";
import { authenticate, authorize, optionalAuth } from "../middlewares/auth.js";
import { submissionLimit } from "../middlewares/submissionLimit.js";
import {
  getReports,
  getReportById,
  getReportSummary,
  createReport,
  updateReport,
  deleteReport,
} from "../controllers/report.controller.js";
import { reviewValidation, runValidation } from "../controllers/validation.controller.js";

const router = Router();
const staff = authorize("admin", "petugas");

// optionalAuth: publik tetap bisa membaca, petugas melihat laporan yang disembunyikan + hasil validasi
router.get("/", optionalAuth, getReports);
router.get("/summary", optionalAuth, getReportSummary);
router.get("/:id", optionalAuth, getReportById);

// Validasi otomatis: keputusan dan jalankan ulang (petugas/admin)
router.patch("/:id/validation", authenticate, staff, reviewValidation);
router.post("/:id/validation/run", authenticate, staff, runValidation);

// POST anonim: submissionLimit sebelum upload agar spam ditolak sebelum file diproses.
// PUT/DELETE: authenticate sebelum upload agar request tanpa token tidak memproses file.
router.post("/", submissionLimit, uploadReportImages, verifyMediaFiles, createReport);
router.put("/:id", authenticate, uploadReportImages, verifyMediaFiles, updateReport);
router.delete("/:id", authenticate, deleteReport);

export default router;
