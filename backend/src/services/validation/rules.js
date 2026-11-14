// Pemeriksaan yang butuh database/jaringan, digabung dengan pemeriksaan murni di checks.js.
import Report from "../../models/Report.js";
import { nearestRoad } from "../osrm.js";
import { VCFG } from "./config.js";
import {
  mk,
  haversineM,
  checkRegion,
  checkImages,
  checkText,
  checkExifLocation,
  checkExifTime,
  checkSoftware,
} from "./checks.js";
import { hamming } from "./imageTools.js";

const round = (n) => Math.round(n);

/** Cari laporan lain yang memakai foto identik (SHA-256) atau sangat mirip (dHash). */
const findImageMatch = async (report, photos) => {
  const hashes = [...new Set(photos.map((p) => p.sha256).filter(Boolean))];
  const chunks = [...new Set(photos.flatMap((p) => p.phashChunks || []))];
  if (!hashes.length && !chunks.length) return null;

  const candidates = await Report.find({
    _id: { $ne: report._id },
    "validation.status": { $ne: "duplicate" },
    $or: [{ "validation.photos.sha256": { $in: hashes } }, { "validation.photos.phashChunks": { $in: chunks } }],
  })
    .select("location validation.photos")
    .limit(30)
    .lean();

  let best = null;
  for (const c of candidates) {
    for (const cp of c.validation?.photos ?? []) {
      for (const p of photos) {
        const exact = !!p.sha256 && p.sha256 === cp.sha256;
        const dist = exact ? 0 : p.phash && cp.phash ? hamming(p.phash, cp.phash) : 64;
        if (!exact && dist > VCFG.phashMaxDistance) continue;
        if (!best || dist < best.dist) best = { candidate: c, dist, exact };
      }
    }
  }
  return best;
};

/**
 * Jalankan semua pemeriksaan non-AI.
 * @param {object} report dokumen laporan (lean) lengkap dengan validation.photos
 * @returns {Promise<{checks: object[], duplicateOf: any}>}
 */
export const runRules = async (report, { now = new Date() } = {}) => {
  const checks = [];
  const add = (c) => {
    if (Array.isArray(c)) checks.push(...c.filter(Boolean));
    else if (c) checks.push(c);
  };

  const point = report.location?.coordinates;
  const photos = report.validation?.photos ?? [];
  let duplicateOf = null;

  add(checkImages(photos));
  add(checkText(report.title, report.description));
  add(checkSoftware(photos));

  if (!point) {
    add(mk("no_location", "Laporan tanpa koordinat", -30, null, "flag"));
    return { checks, duplicateOf };
  }

  add(checkRegion(point));
  add(checkExifLocation(photos, point));
  add(checkExifTime(photos, now));

  // Foto yang sama / mirip pada laporan lain
  const match = await findImageMatch(report, photos);
  if (match) {
    const loc = match.candidate.location?.coordinates;
    const dist = loc ? haversineM(point, loc) : Infinity;
    const kind = match.exact ? "identik" : `mirip (selisih ${match.dist} bit)`;
    if (dist <= VCFG.dupRadiusImageM) {
      duplicateOf = match.candidate._id;
      add(mk("duplicate_image", "Foto sama dengan laporan lain di lokasi yang sama", -30, `laporan ${match.candidate._id}, ${kind}, ${round(dist)} m`, "duplicate"));
    } else {
      add(mk("image_reused", "Foto yang sama dipakai pada laporan di lokasi berbeda", -50, `laporan ${match.candidate._id}, ${kind}, ${Number.isFinite(dist) ? round(dist) + " m" : "lokasi tidak diketahui"}`));
    }
  }

  // Laporan sejenis di titik yang sangat dekat (bisa jadi saksi tambahan, bukan selalu duplikat)
  if (!duplicateOf) {
    const near = await Report.findOne({
      _id: { $ne: report._id },
      type: report.type,
      status: { $nin: ["selesai", "ditolak"] },
      "validation.status": { $nin: ["duplicate", "rejected", "flagged"] },
      createdAt: { $gte: new Date(now.getTime() - VCFG.dupDays * 86400000) },
      location: { $nearSphere: { $geometry: { type: "Point", coordinates: point }, $maxDistance: VCFG.dupRadiusNearM } },
    })
      .select("_id")
      .lean();
    if (near) {
      duplicateOf = near._id;
      add(mk("possible_duplicate", "Ada laporan sejenis di titik yang sangat dekat", -10, `laporan ${near._id} (periksa apakah sama)`));
    }
  }

  // Titik harus berada dekat jalan (hanya laporan jenis "jalan")
  if (VCFG.roadCheckEnabled && report.type === "jalan") {
    const road = await nearestRoad(point, { timeoutMs: VCFG.roadTimeoutMs });
    if (road) {
      if (road.distanceM > VCFG.roadMaxM) {
        add(mk("road_far", "Titik laporan jauh dari jalan yang dikenal", -20, Number.isFinite(road.distanceM) ? `${round(road.distanceM)} m dari jalan terdekat` : "tidak ada jalan di sekitar"));
      } else {
        add(mk("road_ok", "Titik laporan berada di jalan", 5, `${round(road.distanceM)} m dari jalan${road.name ? ` ${road.name}` : ""}`));
      }
    }
  }

  return { checks, duplicateOf };
};
