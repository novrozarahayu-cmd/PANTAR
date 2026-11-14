import crypto from "crypto";
import Report from "../models/Report.js";
import { VCFG } from "../services/validation/config.js";
import { error } from "../utils/responseFormatter.js";

export const clientIp = (req) =>
  String(req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim() ||
  req.socket?.remoteAddress ||
  "unknown";

// IP disimpan sebagai hash bersalt, bukan IP asli.
export const hashIp = (ip) =>
  crypto.createHash("sha256").update(`${process.env.JWT_SECRET || "pantaujalan"}:${ip}`).digest("hex").slice(0, 32);

/**
 * Anti-spam untuk POST /api/reports (anonim). Berbasis database sehingga bekerja di serverless.
 * - Per device (header X-Device-Id dari FE): maksimal VALIDATION_MAX_PER_HOUR per jam.
 * - Per IP: 3x batas itu (IP bisa dipakai bersama, mis. jaringan kampus/kantor).
 */
export const submissionLimit = async (req, res, next) => {
  try {
    const ipHash = hashIp(clientIp(req));
    const deviceId = String(req.headers["x-device-id"] || "").replace(/[^\w-]/g, "").slice(0, 64) || null;
    req.submitter = { ipHash, deviceId };

    const max = VCFG.maxPerHour;
    if (max > 0) {
      const since = new Date(Date.now() - 60 * 60 * 1000);
      const [byIp, byDevice] = await Promise.all([
        Report.countDocuments({ "submitter.ipHash": ipHash, createdAt: { $gte: since } }),
        deviceId ? Report.countDocuments({ "submitter.deviceId": deviceId, createdAt: { $gte: since } }) : 0,
      ]);
      if (byIp >= max * 3 || byDevice >= max) {
        res.set("Retry-After", "3600");
        return error(res, {
          message: "Terlalu banyak laporan dalam satu jam. Coba lagi nanti.",
          statusCode: 429,
        });
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};
