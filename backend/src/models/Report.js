import mongoose from "mongoose";
import { SEVERITY, STATUS, REPORT_TYPES } from "../utils/statusRule.js";

export { SEVERITY, STATUS, REPORT_TYPES };

// Status validasi otomatis (terpisah dari status alur kerja perbaikan "status").
//  pending        : baru masuk / menunggu AI
//  auto_verified  : skor tinggi, langsung masuk antrean kerja
//  needs_review   : perlu dicek petugas
//  flagged        : skor rendah / mencurigakan, disembunyikan dari publik
//  duplicate      : duplikat laporan lain (lihat validation.duplicateOf), disembunyikan dari publik
//  approved / rejected : keputusan petugas, tidak ditimpa proses otomatis
export const VALIDATION_STATUS = ["pending", "auto_verified", "needs_review", "flagged", "duplicate", "approved", "rejected"];
export const HIDDEN_VALIDATION_STATUSES = ["flagged", "duplicate", "rejected"];
// Laporan lama tanpa field validation tetap tampil (tidak cocok dengan $nin).
export const PUBLIC_VALIDATION_FILTER = { "validation.status": { $nin: HIDDEN_VALIDATION_STATUSES } };

const checkSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    label: { type: String, required: true },
    impact: { type: Number, default: 0 },
    detail: { type: String, default: null },
    hard: { type: String, default: undefined },
  },
  { _id: false }
);

const photoSchema = new mongoose.Schema(
  {
    public_id: { type: String, default: null },
    sha256: { type: String, default: null },
    phash: { type: String, default: null },
    phashChunks: { type: [String], default: [] },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    exif: {
      hasGps: { type: Boolean, default: false },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      takenAt: { type: Date, default: null },
      software: { type: String, default: null },
      make: { type: String, default: null },
      model: { type: String, default: null },
    },
  },
  { _id: false }
);

const validationSchema = new mongoose.Schema(
  {
    status: { type: String, enum: VALIDATION_STATUS, default: "pending" },
    trustScore: { type: Number, min: 0, max: 100, default: null },
    checks: { type: [checkSchema], default: [] },
    photos: { type: [photoSchema], default: [] },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: "Report", default: null },
    duplicateCount: { type: Number, default: 0 },
    checkedAt: { type: Date, default: null },
    ai: {
      status: { type: String, enum: ["pending", "processing", "done", "failed", "skipped"], default: "skipped" },
      model: { type: String, default: null },
      attempts: { type: Number, default: 0 },
      lockedAt: { type: Date, default: null },
      error: { type: String, default: null },
      damageVisible: { type: Boolean, default: null },
      suggestedType: { type: String, default: null },
      suggestedSeverity: { type: String, default: null },
      matchesDescription: { type: Boolean, default: null },
      isScreenshot: { type: Boolean, default: null },
      isUnrelated: { type: Boolean, default: null },
      confidence: { type: Number, default: null },
      reason: { type: String, default: null },
      checkedAt: { type: Date, default: null },
    },
    review: {
      decision: { type: String, default: null },
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      at: { type: Date, default: null },
      note: { type: String, default: null },
    },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Judul wajib diisi"], trim: true, maxlength: 150 },
    description: { type: String, required: [true, "Deskripsi wajib diisi"], trim: true },
    address: { type: String, trim: true, default: null },
    street: { type: String, trim: true, default: null },
    village: { type: String, trim: true, default: null },
    district: { type: String, trim: true, default: null },
    regency: { type: String, trim: true, default: null },
    province: { type: String, trim: true, default: null },
    type: { type: String, enum: REPORT_TYPES, default: "lainnya" },
    severity: { type: String, enum: SEVERITY, default: "ringan" },
    status: { type: String, enum: STATUS, default: "menunggu" },
    cost: { type: Number, min: [0, "Total biaya tidak boleh negatif"], default: 0 },
    images: {
      type: [
        {
          url: { type: String, required: true },
          public_id: { type: String, required: true },
          resource_type: {
            type: String,
            enum: ["image", "video", "raw"],
            default: "image",
          },
          format: { type: String, default: null },
          original_filename: { type: String, default: null },
        },
      ],
      default: [],
    },
    validation: { type: validationSchema, default: () => ({}) },
    // Jejak pengirim untuk anti-spam (hash IP, bukan IP asli). Tidak pernah dikirim ke klien.
    submitter: {
      ipHash: { type: String, default: null },
      deviceId: { type: String, default: null },
    },
    // GeoJSON Point, disimpan sebagai [lng, lat]. Dikirim dari FE (latitude dan longitude).
    // Wajib saat membuat laporan baru (dicek di controller agar data lama tanpa lokasi tetap bisa disimpan).
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: {
        type: [Number],
        default: undefined,
        validate: {
          validator: (v) =>
            v == null ||
            (v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90),
          message: "Koordinat tidak valid",
        },
      },
    },
  },
  { timestamps: true }
);

reportSchema.index({ location: "2dsphere" });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ status: 1 });
reportSchema.index({ "validation.status": 1, createdAt: -1 });
reportSchema.index({ "validation.ai.status": 1, createdAt: 1 });
reportSchema.index({ "validation.photos.sha256": 1 });
reportSchema.index({ "validation.photos.phashChunks": 1 });
reportSchema.index({ "submitter.ipHash": 1, createdAt: -1 });
reportSchema.index({ "submitter.deviceId": 1, createdAt: -1 });
reportSchema.index({ province: 1, regency: 1, district: 1, village: 1, street: 1 });

reportSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    delete ret.submitter;
    return ret;
  },
});

export default mongoose.model("Report", reportSchema);
