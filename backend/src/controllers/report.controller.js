import mongoose from "mongoose";
import path from "path";
import Report, { PUBLIC_VALIDATION_FILTER } from "../models/Report.js";
import RepairProgress from "../models/RepairProgress.js";
import { MAX_IMAGES } from "../middlewares/upload.js";
import { success, created, error } from "../utils/responseFormatter.js";
import { getPagination, buildMeta } from "../utils/paginator.js";
import { removeFiles } from "../utils/file.js";
import { resolveLocation } from "../services/geoCode.js";
import { deleteFiles, uploadFiles } from "../utils/cloudinaryUpload.js";
import { analyzeImage } from "../services/validation/imageTools.js";
import { validateReport } from "../services/validation/index.js";
import { isAiImageMime } from "../utils/media.js"; 

const STAFF_ROLES = ["admin", "petugas"];
const canManage = (user, report) =>
  STAFF_ROLES.includes(user.role) || report.reporter?.toString() === user.id;

const isStaff = (user) => STAFF_ROLES.includes(user?.role);

// Data forensik (hash foto, GPS EXIF) dan jejak pengirim tidak pernah dikirim ke klien.
// Masyarakat hanya melihat validation.status; petugas melihat skor, pemeriksaan, dan hasil AI.
const sanitize = (doc, staff) => {
  if (!doc) return doc;
  const o = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  delete o.submitter;
  delete o.__v;
  if (o.validation) {
    delete o.validation.photos;
    if (!staff) o.validation = { status: o.validation.status };
  }
  return o;
};

const LIST_SELECT_STAFF = "-submitter -validation.photos";
const LIST_SELECT_PUBLIC =
  "-submitter -validation.photos -validation.checks -validation.ai -validation.review -validation.duplicateOf -validation.trustScore -validation.duplicateCount";

// Hanya gambar JPG/PNG/WebP yang dianalisis; audio/video menghasilkan null (urutan tetap sejajar
// dengan files) dan tidak masuk ke validation.photos.
const analyzeFiles = (files = []) =>
  Promise.all(files.map((f) => (isAiImageMime(f.mimetype) ? analyzeImage(f.buffer) : null)));
const toPhotoMeta = (uploaded, analyses) =>
  uploaded.flatMap((img, i) => (analyses[i] ? [{ public_id: img.public_id, ...analyses[i] }] : []));
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const REGION_FIELDS = ["street", "village", "district", "regency", "province"];

// Mengubah latitude dan longitude dari body (string) menjadi GeoJSON Point.
// Mengembalikan: GeoJSON Point jika valid, null jika tidak dikirim/bukan angka, undefined jika di luar rentang.
const toCoord = (v) => (v === undefined || v === null || String(v).trim() === "" ? NaN : Number(v));
const buildLocation = (body) => {
  const lat = toCoord(body.latitude);
  const lng = toCoord(body.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined; // di luar rentang
  return { type: "Point", coordinates: [lng, lat] };
};

// GET /api/reports
export const getReports = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, status, severity, order, today, type, validation } = req.query;
    const staff = isStaff(req.user);

    const filter = {};

    // Publik tidak melihat laporan flagged/duplicate/rejected. Petugas melihat semua dan dapat memfilter.
    if (staff) {
      if (validation) filter["validation.status"] = validation;
    } else {
      Object.assign(filter, PUBLIC_VALIDATION_FILTER);
    }

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (severity) filter.severity = severity;

    if (today === "true") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      filter.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    if (search?.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");

      filter.$or = [
        { title: regex },
        { description: regex },
        { address: regex },
      ];
    }

    const sort = {
      createdAt: order === "asc" ? 1 : -1,
    };

    const [items, totalItems] = await Promise.all([
      Report.find(filter)
        .select(staff ? LIST_SELECT_STAFF : LIST_SELECT_PUBLIC)
        .sort(sort)
        .skip(skip)
        .limit(limit),

      Report.countDocuments(filter),
    ]);

    return success(res, {
      message: "Daftar laporan berhasil diambil",
      data: items,
      meta: buildMeta({ page, limit, totalItems }),
    });
  } catch (err) {
    next(err);
  }
};


// GET /api/reports/:id
export const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return error(res, {
        message: "ID laporan tidak valid",
        statusCode: 400,
      });
    }

    const staff = isStaff(req.user);
    const report = await Report.findById(id).lean();

    const hidden = ["flagged", "duplicate", "rejected"].includes(report?.validation?.status);
    if (!report || (hidden && !staff)) {
      return error(res, {
        message: "Laporan tidak ditemukan",
        statusCode: 404,
      });
    }

    const data = {
      ...sanitize(report, staff),
      images: (report.images ?? [])
        .map((image) =>
          typeof image === "string" ? image : image?.url
        )
        .filter(Boolean),
    };

    return success(res, {
      message: "Detail laporan berhasil diambil",
      data,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/summary
export const getReportSummary = async (req, res, next) => {
  try {
    const { status, severity, groupBy, type } = req.query;

    if (groupBy && !REGION_FIELDS.includes(groupBy)) {
      return error(res, {
        message: `groupBy tidak valid. Pilihan: ${REGION_FIELDS.join(", ")}`,
        statusCode: 400,
      });
    }

    const staff = isStaff(req.user);
    const match = staff ? {} : { ...PUBLIC_VALIDATION_FILTER };

    if (status) match.status = status;
    if (severity) match.severity = severity;
    if (type) match.type = type;

    const fields = groupBy ? [groupBy] : REGION_FIELDS;

    const facets = {
      statusSummary: [
        {
          $group: {
            _id: "$status",
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            status: "$_id",
            total: 1,
          },
        },
        { $sort: { status: 1 } },
      ],

      severitySummary: [
        {
          $match: {
            severity: { $ne: null, $exists: true },
          },
        },
        {
          $group: {
            _id: "$severity",
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            severity: "$_id",
            total: 1,
          },
        },
        { $sort: { severity: 1 } },
      ],

      typeSummary: [
        {
          $match: {
            type: { $ne: null, $exists: true },
          },
        },
        {
          $group: {
            _id: "$type",
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            type: "$_id",
            total: 1,
          },
        },
        { $sort: { type: 1 } },
      ],
    };

    if (staff) {
      facets.validationSummary = [
        { $group: { _id: { $ifNull: ["$validation.status", "pending"] }, total: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", total: 1 } },
        { $sort: { status: 1 } },
      ];
    }

    fields.forEach((field) => {
      facets[field] = [
        {
          $match: {
            [field]: { $ne: null },
          },
        },
        {
          $group: {
            _id: `$${field}`,
            total: { $sum: 1 },
          },
        },
        { $sort: { total: -1, _id: 1 } },
        {
          $project: {
            _id: 0,
            name: "$_id",
            total: 1,
          },
        },
      ];
    });

    const [data, totalReports] = await Promise.all([
      Report.aggregate([{ $match: match }, { $facet: facets }]).then(
        (result) => result[0],
      ),
      Report.countDocuments(match),
    ]);

    return success(res, {
      message: "Ringkasan laporan berhasil diambil",
      data,
      meta: {
        groupBy: groupBy || null,
        totalReports,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/reports
export const createReport = async (req, res, next) => {
  const uploadedImages = [];

  try {
    const body = req.body ?? {};
    const { title, description, type, severity } = body;

    // Validasi lokasi sebelum upload agar tidak mengunggah gambar sia-sia.
    const location = buildLocation(body);

    if (!location) {
      return error(res, {
        message:
          "Latitude dan longitude wajib diisi dan harus berupa koordinat yang valid",
        statusCode: 422,
      });
    }

    // Analisis foto (hash, EXIF) dari buffer sebelum diunggah.
    const files = req.files ?? [];
    const analyses = await analyzeFiles(files);

    // Upload gambar ke Cloudinary.
    for (const file of files) {
      const image = await uploadFiles(file, "reports");
      uploadedImages.push(image);
    }

    const payload = {
      title,
      description,
      address:
        typeof body.address === "string"
          ? body.address.trim()
          : "",
      type,
      severity,
      images: uploadedImages,
      location,
      validation: { status: "pending", photos: toPhotoMeta(uploadedImages, analyses) },
      submitter: req.submitter ?? {},
    };

    // Isi alamat dan wilayah berdasarkan koordinat.
    const [lng, lat] = location.coordinates;
    const { address: geoAddress, ...regions } =
      await resolveLocation(lat, lng);

    Object.assign(payload, regions);

    if (!payload.address) {
      payload.address = geoAddress;
    }

    const report = await Report.create(payload);

    // Validasi otomatis tidak boleh menggagalkan pembuatan laporan.
    try {
      await validateReport(report._id);
    } catch (validationError) {
      console.error("Validasi laporan gagal:", validationError.message);
    }

    const fresh = await Report.findById(report._id).lean();

    return created(res, {
      message: "Laporan berhasil dibuat",
      data: sanitize(fresh ?? report, false),
    });
  } catch (err) {
    // Hapus gambar yang sudah terunggah jika proses pembuatan gagal.
    if (uploadedImages.length > 0) {
      try {
        await deleteFiles(uploadedImages);
      } catch (cleanupError) {
        console.error(
          "Gagal membersihkan gambar Cloudinary:",
          cleanupError.message,
        );
      }
    }

    return next(err);
  }
};

// PUT /api/reports/:id
// Body opsional: removeImages (nama file atau path gambar lama yang ingin dihapus)
export const updateReport = async (req, res, next) => {
  const uploadedImages = [];

  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return error(res, {
        message: "ID laporan tidak valid",
        statusCode: 400,
      });
    }

    const report = await Report.findById(id);

    if (!report) {
      return error(res, {
        message: "Laporan tidak ditemukan",
        statusCode: 404,
      });
    }

    if (!canManage(req.user, report)) {
      return error(res, {
        message: "Anda tidak berhak mengubah laporan ini",
        statusCode: 403,
      });
    }

    const body = req.body ?? {};
    const staff = isStaff(req.user);

    if (
      body.status === "selesai" &&
      report.status !== "selesai" &&
      STAFF_ROLES.includes(req.user.role)
    ) {
      return error(res, {
        message:
          "Status selesai diatur otomatis saat progres perbaikan berstatus selesai (dengan foto bukti)",
        statusCode: 400,
      });
    }

    // Normalisasi removeImages agar menjadi array string URL/public_id.
    const parseRemoveImages = (value) => {
      if (value === undefined || value === null || value === "") {
        return [];
      }

      if (Array.isArray(value)) {
        return value.flatMap((item) => parseRemoveImages(item));
      }

      if (typeof value !== "string") {
        return [];
      }

      const trimmed = value.trim();

      if (!trimmed) {
        return [];
      }

      try {
        const parsed = JSON.parse(trimmed);

        // Hindari parsing berulang jika hasilnya sama.
        if (parsed === value) {
          return [trimmed];
        }

        if (Array.isArray(parsed)) {
          return parsed.flatMap((item) => parseRemoveImages(item));
        }

        if (typeof parsed === "string") {
          return parseRemoveImages(parsed);
        }

        return [];
      } catch {
        return [trimmed];
      }
    };

    const removeList = [
      ...new Set(parseRemoveImages(body.removeImages)),
    ];

    const currentImages = report.images ?? [];

    // Cari gambar lama yang dipilih untuk dihapus.
    const toRemove = currentImages.filter((image) => {
      if (!image) return false;

      const publicId = image.public_id ?? "";
      const url = image.url ?? image.secure_url ?? "";
      const fileName = url.split("/").pop()?.split("?")[0] ?? "";

      return removeList.some(
        (item) =>
          item === publicId ||
          item === url ||
          item === fileName,
      );
    });

    const remaining = currentImages.filter(
      (image) => !toRemove.includes(image),
    );

    const files = req.files ?? [];

    // Validasi jumlah gambar setelah penghapusan dan penambahan.
    if (remaining.length + files.length > MAX_IMAGES) {
      return error(res, {
        message: `Total gambar maksimal ${MAX_IMAGES}`,
        statusCode: 400,
      });
    }

    const fields = [
      "title",
      "description",
      "address",
      "type",
      "severity",
    ];

    if (STAFF_ROLES.includes(req.user.role)) {
      fields.push("status");
    }

    fields.forEach((field) => {
      if (body[field] !== undefined) {
        report[field] = body[field];
      }
    });

    // Perbarui koordinat dan informasi wilayah jika koordinat dikirim.
    if (
      body.latitude !== undefined ||
      body.longitude !== undefined
    ) {
      const location = buildLocation(body);

      if (!location) {
        return error(res, {
          message: "Koordinat tidak valid",
          statusCode: 422,
        });
      }

      report.location = location;

      const [lng, lat] = location.coordinates;

      const { address: geoAddress, ...regions } =
        await resolveLocation(lat, lng);

      report.set(regions);

      const addressSent =
        typeof body.address === "string" &&
        body.address.trim() !== "";

      if (!addressSent) {
        report.address = geoAddress;
      }
    }

    // Analisis foto baru sebelum diunggah.
    const analyses = await analyzeFiles(files);

    // Upload gambar baru ke Cloudinary.
    for (const file of files) {
      const image = await uploadFiles(file, "reports");
      uploadedImages.push(image);
    }

    // Simpan gambar yang tersisa beserta gambar baru.
    report.images = [...remaining, ...uploadedImages];

    // Metadata forensik ikut diperbarui; foto yang dihapus dibuang dari metadata.
    const keptIds = new Set(remaining.map((i) => i.public_id));
    const keptPhotos = (report.validation?.photos ?? [])
      .filter((p) => keptIds.has(p.public_id))
      .map((p) => (typeof p.toObject === "function" ? p.toObject() : p));
    report.set("validation.photos", [...keptPhotos, ...toPhotoMeta(uploadedImages, analyses)]);

    // Pelapor mengubah foto/lokasi: validasi diulang dan keputusan lama dibatalkan (anti-penyalahgunaan).
    // Perubahan oleh petugas tidak memicu validasi ulang.
    const locationChanged = body.latitude !== undefined || body.longitude !== undefined;
    const revalidate = !staff && (files.length > 0 || locationChanged);
    if (revalidate) {
      report.set("validation.status", "pending");
      report.set("validation.review", { decision: null, by: null, at: null, note: null });
    }

    await report.save();

    if (revalidate) {
      try {
        await validateReport(report._id);
      } catch (validationError) {
        console.error("Validasi ulang gagal:", validationError.message);
      }
    }

    // Hapus gambar dari Cloudinary setelah database berhasil disimpan.
    if (toRemove.length > 0) {
      try {
        await deleteFiles(toRemove);
      } catch (deleteError) {
        console.error(
          "Gagal menghapus gambar lama dari Cloudinary:",
          deleteError.message,
        );
      }
    }

    const fresh = await Report.findById(report._id).lean();

    return success(res, {
      message: "Laporan berhasil diperbarui",
      data: sanitize(fresh ?? report, staff),
    });
  } catch (err) {
    // Bersihkan gambar baru jika proses upload atau penyimpanan gagal.
    if (uploadedImages.length > 0) {
      try {
        await deleteFiles(uploadedImages);
      } catch (cleanupError) {
        console.error(
          "Gagal membersihkan gambar baru dari Cloudinary:",
          cleanupError.message,
        );
      }
    }

    next(err);
  }
};

// DELETE /api/reports/:id
export const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return error(res, { message: "ID laporan tidak valid", statusCode: 400 });
    }
    const report = await Report.findById(id);
    if (!report) return error(res, { message: "Laporan tidak ditemukan", statusCode: 404 });

    if (!canManage(req.user, report)) {
      return error(res, { message: "Anda tidak berhak menghapus laporan ini", statusCode: 403 });
    }

    const progress = await RepairProgress.find({ report: report._id }).select("images");
    await report.deleteOne();
    await RepairProgress.deleteMany({ report: report._id });
    await removeFiles([...report.images, ...progress.flatMap((p) => p.images)]);
    return success(res, { message: "Laporan berhasil dihapus", data: null });
  } catch (err) {
    next(err);
  }
};