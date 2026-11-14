// Orkestrasi validasi laporan: aturan (sinkron, cepat) -> AI (opsional, bisa antre) -> status akhir.
// Semua penulisan memakai $set pada path tertentu agar tidak menimpa perubahan petugas pada field lain.
import Report from "../../models/Report.js";
import { VCFG } from "./config.js";
import { runRules } from "./rules.js";
import { analyzeWithAI } from "./aiVision.js";
import { aiChecks, computeScore, decideStatus, isAiCheck } from "./scoring.js";
import { mk } from "./checks.js";
import { isAiImage } from "../../utils/media.js"; 

const LOCKED = ["approved", "rejected"]; // keputusan petugas
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Laporan yang lolos otomatis langsung berstatus "diverifikasi" (alur perbaikan), tanpa perlu
// disetujui petugas satu per satu. Hanya menyentuh laporan yang masih "menunggu", jadi status
// yang sudah diubah petugas (diproses, selesai, ditolak, dst.) tidak pernah ditimpa.
const markVerified = (id) => Report.updateOne({ _id: id, status: "menunggu" }, { $set: { status: "diverifikasi" } });

// Pemeriksaan aturan. Cepat; aman dipanggil sebelum response dikirim.
export const runRuleValidation = async (reportId) => {
  const report = await Report.findById(reportId).lean();
  if (!report) return null;
  if (LOCKED.includes(report.validation?.status)) return report;

  const { checks, duplicateOf } = await runRules(report);
  const hasImages = (report.images ?? []).some(isAiImage);
  const useAi = VCFG.ai.enabled && hasImages && !checks.some((c) => c.hard);
  const status = decideStatus({ checks, hasImages, aiPending: useAi });

  const updated = await Report.findByIdAndUpdate(
    reportId,
    {
      $set: {
        "validation.status": status,
        "validation.trustScore": computeScore(checks),
        "validation.checks": checks,
        "validation.duplicateOf": duplicateOf ?? null,
        "validation.checkedAt": new Date(),
        "validation.ai": { status: useAi ? "pending" : "skipped", attempts: 0 },
      },
    },
    { new: true }
  ).lean();

  if (status === "auto_verified") await markVerified(reportId);

  if (status === "duplicate" && duplicateOf && report.validation?.status !== "duplicate") {
    await Report.updateOne({ _id: duplicateOf }, { $inc: { "validation.duplicateCount": 1 } });
  }
  return updated;
};

/** Tahap 2: analisis AI untuk laporan yang sudah di-claim (status ai = processing). */
const processClaimed = async (report) => {
  const id = report._id;
  const attempts = report.validation?.ai?.attempts ?? 1;
  const baseChecks = (report.validation?.checks ?? []).filter((c) => !isAiCheck(c));

  try {
    const ai = await analyzeWithAI(
      report,
      (report.images ?? []).filter(isAiImage).map((i) => i.url).filter(Boolean)
    );
    const checks = [...baseChecks, ...aiChecks(ai)];
    await Report.updateOne(
      { _id: id },
      {
        $set: {
          "validation.trustScore": computeScore(checks),
          "validation.checks": checks,
          "validation.ai": {
            status: "done",
            model: ai.model,
            attempts,
            error: null,
            lockedAt: null,
            damageVisible: ai.damageVisible,
            suggestedType: ai.type,
            suggestedSeverity: ai.severity,
            matchesDescription: ai.matchesDescription,
            isScreenshot: ai.isScreenshot,
            isUnrelated: ai.isUnrelated,
            confidence: ai.confidence,
            reason: ai.reason,
            checkedAt: new Date(),
          },
        },
      }
    );
    const finalStatus = decideStatus({ checks, hasImages: true });
    const res = await Report.updateOne(
      { _id: id, "validation.status": { $nin: LOCKED } },
      { $set: { "validation.status": finalStatus } }
    );
    // matchedCount 0 = petugas sudah memutuskan di sela-sela proses AI, jangan ubah apa pun.
    if (finalStatus === "auto_verified" && res.matchedCount > 0) await markVerified(id);
    return { id, ai: "done" };
  } catch (err) {
    const message = String(err.message || err).slice(0, 500);
    if (attempts < VCFG.ai.maxAttempts) {
      await Report.updateOne(
        { _id: id },
        { $set: { "validation.ai.status": "pending", "validation.ai.error": message, "validation.ai.lockedAt": null } }
      );
      return { id, ai: "retry", error: message };
    }
    // Menyerah: tetap diproses tanpa AI, tetapi tidak pernah auto_verified.
    const checks = [...baseChecks, mk("ai_failed", "AI tidak dapat memproses laporan ini, perlu dicek petugas", 0, message.slice(0, 200))];
    await Report.updateOne(
      { _id: id },
      {
        $set: {
          "validation.checks": checks,
          "validation.trustScore": computeScore(checks),
          "validation.ai.status": "failed",
          "validation.ai.error": message,
          "validation.ai.lockedAt": null,
        },
      }
    );
    await Report.updateOne(
      { _id: id, "validation.status": { $nin: LOCKED } },
      { $set: { "validation.status": decideStatus({ checks, hasImages: true, aiFailed: true }) } }
    );
    return { id, ai: "failed", error: message };
  }
};

/** Claim atomik satu laporan tertentu. */
export const runAiValidation = async (reportId) => {
  const claimed = await Report.findOneAndUpdate(
    { _id: reportId, "validation.ai.status": "pending", "validation.status": { $nin: LOCKED } },
    {
      $set: { "validation.ai.status": "processing", "validation.ai.lockedAt": new Date() },
      $inc: { "validation.ai.attempts": 1 },
    },
    { new: true }
  ).lean();
  return claimed ? processClaimed(claimed) : null;
};

/**
 * Proses antrean AI (dipanggil cron/petugas). Berhenti setelah `limit` laporan atau `budgetMs`
 * (dicek di antara laporan; satu panggilan AI bisa sampai AI_TIMEOUT_MS per model).
 */
export const processPending = async ({ limit = 3, budgetMs = 8000 } = {}) => {
  const started = Date.now();
  const results = [];
  while (results.length < limit && Date.now() - started < budgetMs) {
    const stale = new Date(Date.now() - VCFG.ai.staleLockMs);
    const claimed = await Report.findOneAndUpdate(
      {
        "validation.status": { $nin: LOCKED },
        $or: [
          { "validation.ai.status": "pending" },
          { "validation.ai.status": "processing", "validation.ai.lockedAt": { $lt: stale } },
        ],
      },
      { $set: { "validation.ai.status": "processing", "validation.ai.lockedAt": new Date() }, $inc: { "validation.ai.attempts": 1 } },
      { new: true, sort: { createdAt: 1 } }
    ).lean();
    if (!claimed) break;
    results.push(await processClaimed(claimed));
    if (VCFG.ai.minGapMs > 0) await sleep(VCFG.ai.minGapMs);
  }
  const remaining = await Report.countDocuments({
    "validation.ai.status": "pending",
    "validation.status": { $nin: LOCKED },
  });
  return { processed: results.length, remaining, results };
};

// Antrean dalam proses untuk mode "background" (server yang terus hidup, bukan serverless).
let chain = Promise.resolve();

/** Jadwalkan AI sesuai mode. Mengembalikan Promise hanya untuk mode "inline". */
export const scheduleAi = (reportId) => {
  const mode = VCFG.ai.mode;
  if (mode === "inline") return runAiValidation(reportId).catch((e) => console.error("AI validasi gagal:", e.message));
  if (mode === "background") {
    chain = chain
      .then(() => runAiValidation(reportId))
      .catch((e) => console.error("AI validasi gagal:", e.message))
      .then(() => sleep(VCFG.ai.minGapMs));
  }
  return null; // "queue": diproses lewat /api/validation/process
};

/** Validasi lengkap untuk laporan baru/diubah: aturan dulu, lalu AI sesuai mode. */
export const validateReport = async (reportId) => {
  await runRuleValidation(reportId);
  await scheduleAi(reportId);
};

/** Jalankan ulang penuh (petugas). AI dijalankan langsung, tidak lewat antrean. */
export const rerunValidation = async (reportId, { force = false } = {}) => {
  const current = await Report.findById(reportId).select("validation.status").lean();
  if (!current) return null;
  if (LOCKED.includes(current.validation?.status)) {
    if (!force) return { locked: true };
    await Report.updateOne(
      { _id: reportId },
      { $set: { "validation.status": "pending", "validation.review": { decision: null, by: null, at: null, note: null } } }
    );
  }
  await runRuleValidation(reportId);
  await runAiValidation(reportId);
  return { locked: false };
};
