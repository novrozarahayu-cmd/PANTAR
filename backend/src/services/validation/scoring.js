import { VCFG } from "./config.js";
import { mk } from "./checks.js";

export const computeScore = (checks = []) =>
  Math.max(0, Math.min(100, Math.round(VCFG.baseScore + checks.reduce((s, c) => s + (c.impact || 0), 0))));

/**
 * Status otomatis. Status keputusan petugas ("approved" / "rejected") tidak pernah ditimpa di sini
 * (ditangani pemanggil).
 */
export const decideStatus = ({ checks = [], hasImages = true, aiPending = false, aiFailed = false }) => {
  if (checks.some((c) => c.hard === "duplicate")) return "duplicate";
  if (checks.some((c) => c.hard === "flag")) return "flagged";
  if (aiPending) return "pending";
  const score = computeScore(checks);
  if (!hasImages) return "needs_review";
  if (score >= VCFG.autoVerifyMin) return aiFailed ? "needs_review" : "auto_verified";
  if (score >= VCFG.reviewMin) return "needs_review";
  return "flagged";
};

/** Ubah hasil AI (sudah dinormalisasi) menjadi pemeriksaan bernilai skor. Kode diawali "ai_". */
export const aiChecks = (ai) => {
  if (!ai) return [];
  const out = [];
  const sure = ai.confidence >= VCFG.ai.minConfidence;
  const pct = `${Math.round(ai.confidence * 100)}%`;
  const why = ai.reason ? `${ai.reason} (yakin ${pct})` : `yakin ${pct}`;

  if (!sure) {
    out.push(mk("ai_uncertain", "AI kurang yakin, perlu dicek petugas", 0, why));
  } else if (ai.damageVisible === false) {
    out.push(mk("ai_no_damage", "AI tidak melihat kerusakan pada foto", -45, why));
  } else if (ai.damageVisible === true) {
    out.push(mk("ai_damage_visible", "AI mengonfirmasi ada kerusakan pada foto", 25, why));
  }
  if (sure && ai.isUnrelated) out.push(mk("ai_unrelated", "Foto tampak tidak relevan/stok/bukan lokasi nyata", -40, ai.reason));
  if (sure && ai.isScreenshot) out.push(mk("ai_screenshot", "Foto tampak hasil foto layar", -10, ai.reason));
  if (sure && ai.matchesDescription === false) out.push(mk("ai_mismatch", "Foto tidak sesuai dengan deskripsi", -15, ai.reason));
  return out;
};

export const isAiCheck = (c) => typeof c?.code === "string" && c.code.startsWith("ai_");
