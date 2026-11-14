// Pemeriksaan murni (tanpa database/jaringan) agar mudah diuji.
// Setiap pemeriksaan: { code, label, impact, detail, hard? }
//   impact : perubahan skor (positif = menambah kepercayaan)
//   hard   : "duplicate" | "flag" memaksa status terlepas dari skor
import { VCFG } from "./config.js";

const EARTH_R = 6371000;
const rad = (d) => (d * Math.PI) / 180;

/** Jarak haversine (meter) antara dua titik [lng, lat]. */
export const haversineM = (a, b) => {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(h));
};

export const mk = (code, label, impact, detail = null, hard = null) => ({
  code,
  label,
  impact,
  detail,
  ...(hard ? { hard } : {}),
});

// Kotak kasar wilayah Indonesia
const ID_BOUNDS = { minLat: -11.5, maxLat: 6.5, minLng: 94.5, maxLng: 141.5 };

export const checkRegion = ([lng, lat]) => {
  const inside =
    lat >= ID_BOUNDS.minLat && lat <= ID_BOUNDS.maxLat && lng >= ID_BOUNDS.minLng && lng <= ID_BOUNDS.maxLng;
  return inside ? null : mk("region_outside", "Koordinat di luar wilayah Indonesia", -40, `lat=${lat}, lng=${lng}`, "flag");
};

export const checkImages = (photos) => {
  if (!photos.length) return [mk("no_image", "Laporan tanpa foto", -15, "Tidak ada bukti visual")];
  const out = [];
  const broken = photos.filter((p) => !p.phash).length;
  if (broken) out.push(mk("image_unreadable", "Foto tidak dapat dianalisis", -10, `${broken} foto`));
  const tiny = photos.filter((p) => p.width && p.height && Math.min(p.width, p.height) < VCFG.minImageSide).length;
  if (tiny) out.push(mk("image_tiny", "Resolusi foto terlalu kecil", -10, `${tiny} foto < ${VCFG.minImageSide}px`));
  return out;
};

export const checkText = (title = "", description = "") => {
  const d = String(description).trim();
  const t = String(title).trim();
  const out = [];
  if (d.length < 15) out.push(mk("text_short", "Deskripsi terlalu singkat", -10, `${d.length} karakter`));
  if (/(.)\1{7,}/.test(d) || /(.)\1{7,}/.test(t)) {
    out.push(mk("text_repetitive", "Teks berisi karakter berulang (indikasi spam)", -15));
  }
  return out;
};

/** Bandingkan GPS EXIF (jika ada) dengan titik yang diklik pelapor di peta. */
export const checkExifLocation = (photos, point) => {
  const withGps = photos.filter((p) => p.exif?.hasGps);
  if (!photos.length) return null;
  if (!withGps.length) {
    return mk("exif_gps_absent", "Foto tidak memuat GPS (umum untuk screenshot/WhatsApp), diabaikan", 0);
  }
  const distances = withGps.map((p) => haversineM(point, [p.exif.lng, p.exif.lat]));
  const best = Math.min(...distances);
  const rounded = Math.round(best);
  if (best <= VCFG.exifMatchM) {
    return mk("exif_gps_match", "GPS foto cocok dengan titik laporan", 15, `selisih ${rounded} m`);
  }
  if (best > VCFG.exifMismatchM) {
    return mk("exif_gps_mismatch", "GPS foto jauh dari titik laporan", -25, `selisih ${rounded} m`);
  }
  return mk("exif_gps_near", "GPS foto cukup dekat dengan titik laporan", 0, `selisih ${rounded} m`);
};

/** Bandingkan waktu pengambilan foto (EXIF) dengan waktu pengiriman. */
export const checkExifTime = (photos, now = new Date()) => {
  const times = photos.map((p) => (p.exif?.takenAt ? new Date(p.exif.takenAt) : null)).filter((d) => d && !Number.isNaN(d.getTime()));
  if (!times.length) return null;
  const newest = Math.max(...times.map((d) => d.getTime()));
  const ageH = (now.getTime() - newest) / 3600000;
  if (ageH < -24) return mk("exif_time_future", "Waktu foto berada di masa depan", -10, `${Math.round(-ageH)} jam lebih maju`);
  if (ageH <= VCFG.photoFreshHours) return mk("exif_time_fresh", "Foto diambil baru-baru ini", 10, `${Math.max(0, Math.round(ageH))} jam lalu`);
  if (ageH > VCFG.photoOldDays * 24) return mk("exif_time_old", "Foto sudah lama diambil", -25, `${Math.round(ageH / 24)} hari lalu`);
  return mk("exif_time_ok", "Waktu foto masih wajar", 0, `${Math.round(ageH / 24)} hari lalu`);
};

/** Foto yang disunting aplikasi tertentu perlu perhatian lebih. */
const EDITOR_RE = /(photoshop|gimp|canva|picsart|snapseed|lightroom|midjourney|stable diffusion|dall-?e|firefly)/i;
export const checkSoftware = (photos) => {
  const hit = photos.map((p) => p.exif?.software).find((s) => s && EDITOR_RE.test(s));
  return hit ? mk("exif_edited", "Metadata menunjukkan foto diedit/dihasilkan software", -20, hit) : null;
};
