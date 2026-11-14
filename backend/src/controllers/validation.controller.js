import mongoose from "mongoose";
import Report from "../models/Report.js";
import { success, error } from "../utils/responseFormatter.js";
import { processPending, rerunValidation } from "../services/validation/index.js";
import { VCFG } from "../services/validation/config.js";

const DECISIONS = ["approved", "rejected", "duplicate"];

// PATCH /api/reports/:id/validation  (petugas/admin)
// Body: { decision: "approved" | "rejected" | "duplicate", note?, duplicateOf? }
export const reviewValidation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, note, duplicateOf } = req.body ?? {};

    if (!mongoose.isValidObjectId(id)) return error(res, { message: "ID laporan tidak valid", statusCode: 400 });
    if (!DECISIONS.includes(decision)) {
      return error(res, { message: `decision tidak valid. Pilihan: ${DECISIONS.join(", ")}`, statusCode: 400 });
    }

    const report = await Report.findById(id).select("status validation.status");
    if (!report) return error(res, { message: "Laporan tidak ditemukan", statusCode: 404 });

    const set = {
      "validation.review": { decision, by: req.user._id, at: new Date(), note: note ? String(note).slice(0, 500) : null },
      // Keputusan petugas menutup antrean AI untuk laporan ini.
      "validation.ai.status": "skipped",
      "validation.ai.lockedAt": null,
    };

    if (decision === "approved") {
      set["validation.status"] = "approved";
      set["validation.duplicateOf"] = null;
      if (report.status === "menunggu") set.status = "diverifikasi";
    } else if (decision === "rejected") {
      set["validation.status"] = "rejected";
      if (report.status !== "selesai") set.status = "ditolak";
    } else {
      if (!mongoose.isValidObjectId(duplicateOf) || String(duplicateOf) === id) {
        return error(res, { message: "duplicateOf wajib berupa ID laporan lain yang valid", statusCode: 422 });
      }
      const original = await Report.exists({ _id: duplicateOf });
      if (!original) return error(res, { message: "Laporan asal (duplicateOf) tidak ditemukan", statusCode: 404 });
      set["validation.status"] = "duplicate";
      set["validation.duplicateOf"] = duplicateOf;
      if (report.validation?.status !== "duplicate") {
        await Report.updateOne({ _id: duplicateOf }, { $inc: { "validation.duplicateCount": 1 } });
      }
    }

    const updated = await Report.findByIdAndUpdate(id, { $set: set }, { new: true }).select("-submitter -validation.photos");
    return success(res, { message: "Keputusan validasi disimpan", data: updated });
  } catch (err) {
    next(err);
  }
};

// POST /api/reports/:id/validation/run?force=true  (petugas/admin)
// Menjalankan ulang aturan + AI. Keputusan petugas hanya ditimpa jika force=true.
export const runValidation = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return error(res, { message: "ID laporan tidak valid", statusCode: 400 });

    const result = await rerunValidation(id, { force: req.query.force === "true" });
    if (!result) return error(res, { message: "Laporan tidak ditemukan", statusCode: 404 });
    if (result.locked) {
      return error(res, {
        message: "Laporan sudah diputuskan petugas. Gunakan ?force=true untuk menjalankan ulang.",
        statusCode: 409,
      });
    }

    const updated = await Report.findById(id).select("-submitter -validation.photos");
    return success(res, { message: "Validasi dijalankan ulang", data: updated });
  } catch (err) {
    next(err);
  }
};

// GET|POST /api/validation/process?limit=3  (petugas/admin atau CRON_SECRET)
// Memproses antrean AI. Dipakai di Vercel (mode "queue") lewat cron atau tombol di dashboard.
export const processQueue = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 3, 1), 10);
    const data = await processPending({ limit, budgetMs: Number(process.env.AI_QUEUE_BUDGET_MS) || 8000 });
    return success(res, { message: "Antrean validasi diproses", data });
  } catch (err) {
    next(err);
  }
};

// GET /api/validation/stats  (petugas/admin)
export const validationStats = async (_req, res, next) => {
  try {
    const [byStatus, byAi] = await Promise.all([
      Report.aggregate([
        { $group: { _id: { $ifNull: ["$validation.status", "pending"] }, total: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", total: 1 } },
        { $sort: { status: 1 } },
      ]),
      Report.aggregate([
        { $group: { _id: "$validation.ai.status", total: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", total: 1 } },
      ]),
    ]);
    return success(res, {
      message: "Statistik validasi berhasil diambil",
      data: { byStatus, byAi, aiEnabled: VCFG.ai.enabled, aiMode: VCFG.ai.mode, models: VCFG.ai.models },
    });
  } catch (err) {
    next(err);
  }
};
