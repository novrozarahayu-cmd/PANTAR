import assert from "node:assert/strict";
import sharp from "sharp";
import { parseExifBuffer, extractExif } from "../src/services/validation/exif.js";
import { detectImageType, dHash, hamming, hashChunks, analyzeImage } from "../src/services/validation/imageTools.js";
import { parseModelJson, normalizeAi } from "../src/services/validation/aiVision.js";
import * as C from "../src/services/validation/checks.js";
import { computeScore, decideStatus, aiChecks } from "../src/services/validation/scoring.js";

let n = 0;
const t = async (name, fn) => { await fn(); n++; console.log("ok -", name); };

// --- builder TIFF/EXIF manual (little-endian) dengan GPS + tanggal ---
const buildExif = ({ lat, lng, date, software }) => {
  const parts = []; // [offset-sorted] kita rakit dengan layout tetap
  const le = Buffer.alloc(0);
  const buf = Buffer.alloc(512);
  let o = 0;
  const w16 = (v, at = o) => { buf.writeUInt16LE(v, at); };
  const w32 = (v, at) => { buf.writeUInt32LE(v, at); };
  buf.write("II", 0, "latin1"); w16(42, 2); w32(8, 4);
  // IFD0 @8 : 4 entri (Software, ExifPtr, GPSPtr) -> 3 entri
  const ifd0 = 8; const entries0 = 3;
  w16(entries0, ifd0);
  const sw = (software || "Cam") + "\0";
  const swOff = 200, exifIfd = 240, gpsIfd = 300, dateOff = 280, latOff = 400, lngOff = 430;
  const ent = (i, tag, type, count, val) => { const e = ifd0 + 2 + i * 12; w16(tag, e); w16(type, e + 2); w32(count, e + 4); w32(val, e + 8); };
  ent(0, 0x0131, 2, sw.length, swOff);
  ent(1, 0x8769, 4, 1, exifIfd);
  ent(2, 0x8825, 4, 1, gpsIfd);
  w32(0, ifd0 + 2 + 36);
  buf.write(sw, swOff, "latin1");
  // Exif IFD
  w16(1, exifIfd);
  { const e = exifIfd + 2; w16(0x9003, e); w16(2, e + 2); w32(20, e + 4); w32(dateOff, e + 8); }
  buf.write(date + "\0", dateOff, "latin1");
  // GPS IFD : LatRef, Lat, LngRef, Lng
  w16(4, gpsIfd);
  const g = (i, tag, type, count, val) => { const e = gpsIfd + 2 + i * 12; w16(tag, e); w16(type, e + 2); w32(count, e + 4); if (type === 2) { buf.write(val, e + 8, "latin1"); } else w32(val, e + 8); };
  g(0, 1, 2, 2, lat < 0 ? "S\0" : "N\0");
  g(1, 2, 5, 3, latOff);
  g(2, 3, 2, 2, lng < 0 ? "W\0" : "E\0");
  g(3, 4, 5, 3, lngOff);
  const rat = (at, v) => { const a = Math.abs(v); const d = Math.floor(a); const m = Math.floor((a - d) * 60); const s = ((a - d) * 60 - m) * 60;
    w32(d, at); w32(1, at + 4); w32(m, at + 8); w32(1, at + 12); w32(Math.round(s * 10000), at + 16); w32(10000, at + 20); };
  rat(latOff, lat); rat(lngOff, lng);
  return Buffer.concat([Buffer.from("Exif\0\0", "latin1"), buf]);
};

await t("EXIF parser membaca GPS, waktu (+07:00 default), software", () => {
  const ex = parseExifBuffer(buildExif({ lat: -6.2, lng: 106.816666, date: "2026:11:09 10:00:00", software: "Pixel Camera" }));
  assert.ok(Math.abs(ex.gps.lat - -6.2) < 1e-4, `lat ${ex.gps?.lat}`);
  assert.ok(Math.abs(ex.gps.lng - 106.8166) < 1e-3, `lng ${ex.gps?.lng}`);
  assert.equal(ex.takenAt.toISOString(), "2026-11-09T03:00:00.000Z");
  assert.equal(ex.software, "Pixel Camera");
});
await t("EXIF parser tahan input rusak/acak/kosong", () => {
  for (const b of [Buffer.alloc(0), Buffer.from("halo dunia"), Buffer.alloc(300, 0xff), Buffer.from("II*\0\xff\xff\xff\xff" + "x".repeat(20), "latin1")]) {
    const ex = parseExifBuffer(b); assert.equal(ex.gps, null);
  }
});

const mkImg = (w, h, fn) => {
  const raw = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = fn(x, y); const i = (y * w + x) * 3; raw[i] = v[0]; raw[i + 1] = v[1]; raw[i + 2] = v[2]; }
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } });
};
const A = (x, y) => [x * 255 / 400 | 0, (y * 3) % 255, ((x * y) >> 4) % 255];
const B = (x, y) => [(y * 255 / 300) | 0, (x * 5) % 255, 255 - ((x + y) % 255)];

await t("detectImageType dari magic bytes", async () => {
  const jpg = await mkImg(400, 300, A).jpeg().toBuffer();
  const png = await mkImg(400, 300, A).png().toBuffer();
  const webp = await mkImg(400, 300, A).webp().toBuffer();
  assert.equal(detectImageType(jpg), "image/jpeg");
  assert.equal(detectImageType(png), "image/png");
  assert.equal(detectImageType(webp), "image/webp");
  assert.equal(detectImageType(Buffer.from("%PDF-1.4 hello world....")), null);
  assert.equal(detectImageType(Buffer.from("<?php echo 1; ?> aaaaaaaa")), null);
});
await t("dHash: kompresi/resize mirip (<=6 bit), gambar beda jauh", async () => {
  const orig = await mkImg(400, 300, A).jpeg({ quality: 95 }).toBuffer();
  const recomp = await sharp(orig).resize(200).jpeg({ quality: 40 }).toBuffer();
  const other = await mkImg(400, 300, B).jpeg().toBuffer();
  const h1 = await dHash(orig), h2 = await dHash(recomp), h3 = await dHash(other);
  assert.equal(h1.length, 16);
  assert.ok(hamming(h1, h2) <= 6, `mirip: ${hamming(h1, h2)}`);
  assert.ok(hamming(h1, h3) > 10, `beda: ${hamming(h1, h3)}`);
  // pigeonhole: jarak<=7 -> minimal satu chunk sama
  const c1 = hashChunks(h1), c2 = hashChunks(h2);
  assert.ok(c1.some((c) => c2.includes(c)));
});
await t("analyzeImage + extractExif lewat sharp (EXIF GPS nyata di JPEG)", async () => {
  let jpg = await mkImg(400, 300, A).jpeg().toBuffer();
  const plain = await analyzeImage(jpg);
  assert.equal(plain.exif.hasGps, false);
  assert.equal(plain.width, 400);
  try {
    const withExif = await sharp(jpg).withExif({ IFD0: { Software: "Photoshop 25" } }).jpeg().toBuffer();
    const a = await analyzeImage(withExif);
    assert.equal(a.exif.software, "Photoshop 25");
    console.log("   (sharp->EXIF software terbaca)");
  } catch (e) { console.log("   (withExif tidak tersedia:", e.message, ")"); }
});

await t("checks: lokasi EXIF match / mismatch / absent", () => {
  const p = [106.8, -6.2];
  const near = [{ exif: { hasGps: true, lng: 106.8005, lat: -6.2 } }];
  const far = [{ exif: { hasGps: true, lng: 107.5, lat: -6.2 } }];
  assert.equal(C.checkExifLocation(near, p).code, "exif_gps_match");
  assert.equal(C.checkExifLocation(far, p).code, "exif_gps_mismatch");
  assert.equal(C.checkExifLocation([{ exif: { hasGps: false } }], p).impact, 0);
  assert.equal(C.checkExifLocation([], p), null);
});
await t("checks: waktu EXIF fresh/old/future/absent", () => {
  const now = new Date("2026-11-09T12:00:00Z");
  const f = (d) => [{ exif: { takenAt: d } }];
  assert.equal(C.checkExifTime(f(new Date("2026-11-09T06:00:00Z")), now).code, "exif_time_fresh");
  assert.equal(C.checkExifTime(f(new Date("2026-10-01T06:00:00Z")), now).code, "exif_time_old");
  assert.equal(C.checkExifTime(f(new Date("2026-11-20T06:00:00Z")), now).code, "exif_time_future");
  assert.equal(C.checkExifTime(f(new Date("2026-11-01T06:00:00Z")), now).code, "exif_time_ok");
  assert.equal(C.checkExifTime([{ exif: {} }], now), null);
});
await t("checks: wilayah, teks, gambar, software", () => {
  assert.equal(C.checkRegion([106.8, -6.2]), null);
  assert.equal(C.checkRegion([-0.1, 51.5]).hard, "flag");
  assert.equal(C.checkText("ok", "pendek")[0].code, "text_short");
  assert.equal(C.checkText("aaaaaaaaaa", "jalan berlubang besar sekali di depan sekolah")[0].code, "text_repetitive");
  assert.equal(C.checkImages([])[0].code, "no_image");
  assert.equal(C.checkSoftware([{ exif: { software: "Adobe Photoshop" } }]).code, "exif_edited");
  assert.equal(C.checkSoftware([{ exif: { software: "Pixel Camera" } }]), null);
  assert.ok(Math.abs(C.haversineM([106.8, -6.2], [106.8, -6.201]) - 111) < 2);
});
await t("scoring: skenario realistis", () => {
  const legit = [C.mk("road_ok", "", 5), ...aiChecks({ damageVisible: true, confidence: 0.9, isScreenshot: false, isUnrelated: false, matchesDescription: true, reason: "lubang" })];
  assert.equal(computeScore(legit), 80);
  assert.equal(decideStatus({ checks: legit }), "auto_verified");
  const fake = aiChecks({ damageVisible: false, confidence: 0.9, isUnrelated: true, matchesDescription: false, reason: "meme" });
  assert.equal(decideStatus({ checks: fake }), "flagged");
  const unsure = aiChecks({ damageVisible: true, confidence: 0.3 });
  assert.equal(decideStatus({ checks: unsure }), "needs_review");
  assert.equal(decideStatus({ checks: legit, aiPending: true }), "pending");
  assert.equal(decideStatus({ checks: [C.mk("d", "", -30, null, "duplicate")] }), "duplicate");
  assert.equal(decideStatus({ checks: [], hasImages: false }), "needs_review");
  assert.equal(decideStatus({ checks: [C.mk("x", "", 30)], aiFailed: true }), "needs_review");
  assert.equal(computeScore([C.mk("a", "", 999)]), 100);
});
await t("AI: parse JSON dari output model kotor", () => {
  const good = '<think>hmm {x}</think>\n```json\n{"damage_visible": true, "type":"jalan","severity":"sedang","matches_description":true,"is_screenshot_or_screen_photo":false,"is_unrelated_or_stock":false,"confidence":0.8,"reason":"Lubang besar"}\n```\nSemoga membantu';
  const r = normalizeAi(parseModelJson(good));
  assert.equal(r.damageVisible, true); assert.equal(r.severity, "sedang"); assert.equal(r.confidence, 0.8);
  assert.equal(normalizeAi(parseModelJson("tidak ada json")), null);
  assert.equal(normalizeAi(parseModelJson('{"foo":1}')), null);
  const weird = normalizeAi(parseModelJson('{"damage_visible":"true","type":"hack","severity":"x","confidence":5}'));
  assert.equal(weird.damageVisible, true); assert.equal(weird.type, null); assert.equal(weird.confidence, 1);
});
console.log(`\n${n} test lulus`);
