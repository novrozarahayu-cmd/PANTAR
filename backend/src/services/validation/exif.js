// Parser EXIF minimal (tanpa dependensi) untuk GPS, waktu pengambilan, dan software.
// Semua kegagalan menghasilkan objek kosong: EXIF itu opsional dan sering hilang
// (screenshot, WhatsApp, kompresi browser), jadi tidak boleh membuat laporan gagal.
import sharp from "sharp";
import { VCFG } from "./config.js";

const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
const EMPTY = Object.freeze({ gps: null, takenAt: null, software: null, make: null, model: null });

const makeReader = (buf, base, le) => ({
  u16: (o) => (le ? buf.readUInt16LE(base + o) : buf.readUInt16BE(base + o)),
  u32: (o) => (le ? buf.readUInt32LE(base + o) : buf.readUInt32BE(base + o)),
  slice: (o, n) => buf.subarray(base + o, base + o + n),
});

const readValue = (r, type, count, offset) => {
  if (type === 2) return r.slice(offset, count).toString("latin1").replace(/\0+$/, "").trim();
  if (type === 3) return Array.from({ length: count }, (_, i) => r.u16(offset + i * 2));
  if (type === 4) return Array.from({ length: count }, (_, i) => r.u32(offset + i * 4));
  if (type === 5) {
    return Array.from({ length: count }, (_, i) => {
      const num = r.u32(offset + i * 8);
      const den = r.u32(offset + i * 8 + 4);
      return den === 0 ? NaN : num / den;
    });
  }
  return Array.from(r.slice(offset, count));
};

const readIfd = (r, offset) => {
  const out = new Map();
  const count = r.u16(offset);
  if (count > 512) return out;
  for (let i = 0; i < count; i++) {
    const e = offset + 2 + i * 12;
    const tag = r.u16(e);
    const type = r.u16(e + 2);
    const n = r.u32(e + 4);
    const size = (TYPE_SIZE[type] ?? 0) * n;
    if (!size || size > 4096) continue;
    const valueOffset = size <= 4 ? e + 8 : r.u32(e + 8);
    out.set(tag, readValue(r, type, n, valueOffset));
  }
  return out;
};

const dms = (v, ref) => {
  if (!Array.isArray(v) || v.length < 3 || v.some((x) => !Number.isFinite(x))) return null;
  const deg = v[0] + v[1] / 60 + v[2] / 3600;
  return /^[SW]/i.test(ref || "") ? -deg : deg;
};

const parseDate = (str, offsetStr) => {
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(str || "");
  if (!m) return null;
  const offset = /^[+-]\d{2}:\d{2}$/.test(offsetStr || "") ? offsetStr : VCFG.exifDefaultOffset;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${offset}`);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Parse buffer EXIF (dengan atau tanpa header "Exif\0\0"). */
export const parseExifBuffer = (buf) => {
  try {
    if (!buf || buf.length < 14) return { ...EMPTY };
    let base = buf.indexOf("Exif\0\0", 0, "latin1");
    base = base >= 0 ? base + 6 : 0;
    const order = buf.toString("latin1", base, base + 2);
    if (order !== "II" && order !== "MM") return { ...EMPTY };
    const r = makeReader(buf, base, order === "II");
    if (r.u16(2) !== 42) return { ...EMPTY };

    const ifd0 = readIfd(r, r.u32(4));
    const result = {
      ...EMPTY,
      software: ifd0.get(0x0131) || null,
      make: ifd0.get(0x010f) || null,
      model: ifd0.get(0x0110) || null,
    };

    const exifPtr = ifd0.get(0x8769)?.[0];
    if (exifPtr) {
      const exifIfd = readIfd(r, exifPtr);
      result.takenAt = parseDate(exifIfd.get(0x9003) || exifIfd.get(0x9004), exifIfd.get(0x9011));
    }
    if (!result.takenAt) result.takenAt = parseDate(ifd0.get(0x0132));

    const gpsPtr = ifd0.get(0x8825)?.[0];
    if (gpsPtr) {
      const g = readIfd(r, gpsPtr);
      const lat = dms(g.get(2), g.get(1));
      const lng = dms(g.get(4), g.get(3));
      const valid =
        lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
      if (valid) result.gps = { lat, lng };
    }
    return result;
  } catch {
    return { ...EMPTY };
  }
};

/** Baca EXIF dari buffer gambar apa pun (JPEG/PNG/WebP) lewat sharp. */
export const extractExif = async (imageBuffer) => {
  try {
    const { exif } = await sharp(imageBuffer).metadata();
    return exif ? parseExifBuffer(exif) : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
};
