import Report from "../models/Report.js";
import RepairProgress from "../models/RepairProgress.js";
import { decideReportStatus } from "../utils/statusRule.js";

/**
 * Hitung ulang status laporan dari progres perbaikannya dan simpan jika berubah.
 * Dipanggil setiap kali progres dibuat, diubah, atau dihapus. Hasilnya idempoten,
 * jadi aman dipanggil ulang kapan saja.
 * @returns {Promise<string|null>} status laporan terbaru, atau null jika laporan tidak ada
 */
export const syncReportStatus = async (reportId) => {
  const report = await Report.findById(reportId);
  if (!report) return null;

  const [done, active] = await Promise.all([
    RepairProgress.exists({ report: reportId, status: "selesai" }),
    RepairProgress.exists({ report: reportId, status: "dikerjakan" }),
  ]);

  const next = decideReportStatus(report.status, { hasDone: !!done, hasActive: !!active });
  if (next !== report.status) {
    report.status = next;
    await report.save();
  }
  return report.status;
};
