import mongoose from "mongoose";
import path from "path";
import Report from "../models/Report.js";
import RepairProgress from "../models/RepairProgress.js";
import { MAX_IMAGES } from "../middlewares/upload.js";
import { syncReportStatus } from "../services/reportStatus.js";
import { success, created, error } from "../utils/responseFormatter.js";
import { removeFiles } from "../utils/file.js";
import { deleteFiles, uploadFiles } from "../utils/cloudinaryUpload.js";

const toImagePaths = (files = []) => files.map((f) => `uploads/progress/${f.filename}`);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/reports/:reportId/progress (publik)
export const listProgress = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { search, status } = req.query;

    if (!mongoose.isValidObjectId(reportId)) {
      return error(res, {
        message: "ID laporan tidak valid",
        statusCode: 400,
      });
    }

    const report = await Report.findById(reportId).select("status");

    if (!report) {
      return error(res, {
        message: "Laporan tidak ditemukan",
        statusCode: 404,
      });
    }

    const filter = { report: reportId };

    if (status) {
      filter.status = status;
    }

    if (search?.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");

      filter.$or = [
        { title: regex },
        { description: regex },
      ];
    }

    const items = await RepairProgress.find(filter)
      .sort({ createdAt: 1 })
      .lean();

    const data = items.map((item) => ({
      ...item,
      images: (item.images ?? [])
        .map((image) =>
          typeof image === "string" ? image : image?.url
        )
        .filter(Boolean),
    }));

    return success(res, {
      message: "Progres perbaikan berhasil diambil",
      data,
      meta: {
        reportStatus: report.status,
        totalItems: data.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/progress/:id (publik)
export const getProgressById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return error(res, {
        message: "ID progres tidak valid",
        statusCode: 400,
      });
    }

    const item = await RepairProgress.findById(id).lean();

    if (!item) {
      return error(res, {
        message: "Progres tidak ditemukan",
        statusCode: 404,
      });
    }

    const data = {
      ...item,
      images: (item.images ?? [])
        .map((image) =>
          typeof image === "string" ? image : image?.url
        )
        .filter(Boolean),
    };

    return success(res, {
      message: "Detail progres berhasil diambil",
      data,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/reports/:reportId/progress  (admin/petugas, form-data, field images wajib minimal 1)
// Body: title (wajib), description, status (direncanakan | dikerjakan | selesai, default dikerjakan)
export const createProgress = async (req, res, next) => {
  const uploadedImages = [];
  let saved = false;

  try {
    const { reportId } = req.params;

    if (!mongoose.isValidObjectId(reportId)) {
      return error(res, {
        message: "ID laporan tidak valid",
        statusCode: 400,
      });
    }

    const report = await Report.findById(reportId);

    if (!report) {
      return error(res, {
        message: "Laporan tidak ditemukan",
        statusCode: 404,
      });
    }

    if (report.status === "ditolak") {
      return error(res, {
        message: "Laporan yang ditolak tidak dapat diberi progres",
        statusCode: 400,
      });
    }

    if (report.status === "selesai") {
      return error(res, {
        message:
          "Laporan sudah selesai. Ubah atau hapus progres 'selesai' terlebih dahulu jika ingin membuka kembali",
        statusCode: 400,
      });
    }

    const files = req.files ?? [];

    const body = req.body ?? {};

    const cost = body.cost === undefined ? 0 : Number(body.cost);

    if (!Number.isFinite(cost) || cost < 0) {
      return error(res, {
        message: "Biaya progres harus berupa angka dan tidak boleh negatif",
        statusCode: 422,
      });
    }

    if (files.length > 1) {
      // Upload foto bukti ke Cloudinary.
      for (const file of files) {
        const image = await uploadFiles(file, "progress");
        uploadedImages.push(image);
      }
    }

    const item = await RepairProgress.create({
      report: report._id,
      title: body.title,
      description: body.description,
      status: body.status || undefined,
      cost,
      images: uploadedImages,
      createdBy: req.user._id,
      createdByName: req.user.name,
    });

    // Tambahkan biaya progress ke total biaya laporan.
    await Report.updateOne(
      { _id: report._id },
      { $inc: { cost } },
    );

    saved = true;

    const reportStatus = await syncReportStatus(report._id);

    return created(res, {
      message:
        reportStatus === "selesai"
          ? "Progres dicatat. Perbaikan selesai, status laporan otomatis menjadi selesai"
          : "Progres perbaikan berhasil dicatat",
      data: {
        progress: item,
        reportStatus,
      },
    });
  } catch (err) {
    // Jangan hapus foto yang sudah direferensikan oleh data tersimpan.
    if (!saved && uploadedImages.length > 0) {
      try {
        await deleteFiles(uploadedImages);
      } catch (cleanupError) {
        console.error(
          "Gagal membersihkan foto progres di Cloudinary:",
          cleanupError.message,
        );
      }
    }

    return next(err);
  }
};

// PUT /api/progress/:id  (admin/petugas) - Body opsional: title, description, status, removeImages
export const updateProgress = async (req, res, next) => {
  const uploadedImages = [];
  let saved = false;

  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return error(res, {
        message: "ID progres tidak valid",
        statusCode: 400,
      });
    }

    const item = await RepairProgress.findById(id);

    if (!item) {
      return error(res, {
        message: "Progres tidak ditemukan",
        statusCode: 404,
      });
    }

    const body = req.body ?? {};

    let costDifference = 0;

    if (body.cost !== undefined) {
      const newCost = Number(body.cost);

      if (!Number.isFinite(newCost) || newCost < 0) {
        return error(res, {
          message: "Biaya progres harus berupa angka dan tidak boleh negatif",
          statusCode: 422,
        });
      }

      costDifference = newCost - (item.cost ?? 0);
      item.cost = newCost;
    }

    const currentImages = item.images ?? [];

    // removeImages berisi public_id gambar Cloudinary.
    let removeList = body.removeImages || [];

    if (!Array.isArray(removeList)) {
      removeList = [removeList];
    }

    const toRemove = currentImages.filter(
      (image) =>
        image?.public_id &&
        removeList.includes(image.public_id),
    );

    const remaining = currentImages.filter(
      (image) => !toRemove.includes(image),
    );

    const files = req.files ?? [];
    const total = remaining.length + files.length;

    if (total > MAX_IMAGES) {
      return error(res, {
        message: `Total foto maksimal ${MAX_IMAGES}`,
        statusCode: 400,
      });
    }

    if (total < 1) {
      return error(res, {
        message:
          "Setiap progres harus memiliki minimal 1 foto bukti",
        statusCode: 422,
      });
    }

    ["title", "description", "status"].forEach((field) => {
      if (body[field] !== undefined) {
        item[field] = body[field];
      }
    });

    // Upload foto baru ke Cloudinary.
    for (const file of files) {
      const image = await uploadFiles(file, "progress");
      uploadedImages.push(image);
    }

    item.images = [...remaining, ...uploadedImages];

    await item.save();
    saved = true;

    // Sesuaikan total biaya laporan berdasarkan selisih biaya.
    if (costDifference !== 0) {
      await Report.updateOne(
        { _id: item.report },
        { $inc: { cost: costDifference } },
      );
    }

    // Hapus foto lama setelah perubahan database berhasil.
    if (toRemove.length > 0) {
      try {
        await deleteFiles(toRemove);
      } catch (deleteError) {
        console.error(
          "Gagal menghapus foto lama dari Cloudinary:",
          deleteError.message,
        );
      }
    }

    const reportStatus = await syncReportStatus(item.report);

    return success(res, {
      message: "Progres perbaikan berhasil diperbarui",
      data: {
        progress: item,
        reportStatus,
      },
    });
  } catch (err) {
    // Hanya hapus foto baru jika belum tersimpan di database.
    if (!saved && uploadedImages.length > 0) {
      try {
        await deleteFiles(uploadedImages);
      } catch (cleanupError) {
        console.error(
          "Gagal membersihkan foto baru di Cloudinary:",
          cleanupError.message,
        );
      }
    }

    return next(err);
  }
};

// DELETE /api/progress/:id  (admin/petugas)
export const deleteProgress = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return error(res, {
        message: "ID progres tidak valid",
        statusCode: 400,
      });
    }

    const item = await RepairProgress.findById(id);

    if (!item) {
      return error(res, {
        message: "Progres tidak ditemukan",
        statusCode: 404,
      });
    }

    // Kurangi total biaya laporan sesuai biaya progres yang dihapus.
    await Report.updateOne(
      { _id: item.report },
      { $inc: { cost: -(item.cost ?? 0) } },
    );

    await item.deleteOne();
    await removeFiles(item.images);

    const reportStatus = await syncReportStatus(item.report);

    return success(res, {
      message: "Progres perbaikan berhasil dihapus",
      data: { reportStatus },
    });
  } catch (err) {
    next(err);
  }
};
