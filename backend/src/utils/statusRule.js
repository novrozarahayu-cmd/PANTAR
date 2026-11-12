export const SEVERITY = ["ringan", "sedang", "berat"];
export const STATUS = ["menunggu", "diverifikasi", "diproses", "selesai", "ditolak"];
export const PROGRESS_STATUS = ["direncanakan", "dikerjakan", "selesai"];
export const REPORT_TYPES = ["jalan", "lampu-jalan", "trotoar", "halte", "taman", "lainnya"];

/**
 * Tentukan status laporan setelah progres berubah.
 *
 * @param {string} current status laporan saat ini
 * @param {{hasDone: boolean, hasActive: boolean}} progress ringkasan progres laporan itu
 *   hasDone   = ada progres berstatus "selesai"
 *   hasActive = ada progres berstatus "dikerjakan"
 *
 * Aturan:
 *  1. "ditolak" tidak pernah diubah oleh progres.
 *  2. Ada progres "selesai"  -> laporan "selesai".
 *  3. Laporan "selesai" tetapi progres "selesai" sudah tidak ada (dihapus/diubah) -> kembali "diproses".
 *  4. Ada progres "dikerjakan" dan laporan masih "menunggu"/"diverifikasi" -> "diproses".
 *  5. Selain itu status tidak berubah.
 */
export const decideReportStatus = (current, { hasDone, hasActive }) => {
  if (current === "ditolak") return current;
  if (hasDone) return "selesai";
  if (current === "selesai") return "diproses";
  if (hasActive && (current === "menunggu" || current === "diverifikasi")) return "diproses";
  return current;
};
