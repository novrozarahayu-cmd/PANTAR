import assert from "node:assert/strict";
import {
  detectMediaType,
  detectImageType,
  isAiImage,
  isAiImageMime,
  isAllowedMime,
  mediaKind,
  normalizeMime,
} from "../src/utils/media.js";

let n = 0;
const t = (name, fn) => { fn(); n++; console.log("ok -", name); };

const pad = (...parts) => Buffer.concat([...parts.map((p) => (Buffer.isBuffer(p) ? p : Buffer.from(p, "latin1"))), Buffer.alloc(16)]);
const ftyp = (brand) => pad(Buffer.from([0, 0, 0, 0x18]), "ftyp", brand);

t("mimetype: gambar, audio, video diizinkan; lainnya tidak", () => {
  for (const m of ["image/jpeg", "image/png", "image/webp", "audio/mpeg", "audio/webm;codecs=opus", "video/mp4", "video/quicktime"]) {
    assert.ok(isAllowedMime(m), m);
  }
  for (const m of ["application/pdf", "image/gif", "image/heic", "text/html", "application/x-msdownload", ""]) {
    assert.equal(isAllowedMime(m), false, m);
  }
  assert.equal(normalizeMime("Audio/WebM; codecs=opus"), "audio/webm");
  assert.equal(mediaKind("audio/webm"), "audio");
  assert.equal(mediaKind("video/webm"), "video");
  assert.equal(mediaKind("image/png"), "image");
});

t("gambar tetap terdeteksi (jpg, png, webp)", () => {
  const jpg = pad(Buffer.from([0xff, 0xd8, 0xff, 0xe0]));
  const png = pad(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = pad("RIFF", Buffer.from([1, 0, 0, 0]), "WEBP");
  assert.deepEqual(detectMediaType(jpg), { kind: "image", mimetype: "image/jpeg" });
  assert.deepEqual(detectMediaType(png), { kind: "image", mimetype: "image/png" });
  assert.deepEqual(detectMediaType(webp), { kind: "image", mimetype: "image/webp" });
  assert.equal(detectImageType(webp), "image/webp");
});

t("audio: mp3 (ID3 dan frame sync), wav, ogg, flac, aac", () => {
  assert.equal(detectMediaType(pad("ID3", Buffer.from([4, 0]))).mimetype, "audio/mpeg");
  assert.equal(detectMediaType(pad(Buffer.from([0xff, 0xfb, 0x90, 0x00]))).mimetype, "audio/mpeg");
  assert.equal(detectMediaType(pad("RIFF", Buffer.from([1, 0, 0, 0]), "WAVE")).mimetype, "audio/wav");
  assert.equal(detectMediaType(pad("OggS", Buffer.from([0, 2]))).mimetype, "audio/ogg");
  assert.equal(detectMediaType(pad("fLaC", Buffer.from([0, 0]))).mimetype, "audio/flac");
  assert.equal(detectMediaType(pad(Buffer.from([0xff, 0xf1, 0x50, 0x80]))).mimetype, "audio/aac");
  assert.equal(detectMediaType(pad("ID3", Buffer.from([4, 0]))).kind, "audio");
});

t("video: mp4, mov, 3gp, avi, webm", () => {
  assert.deepEqual(detectMediaType(ftyp("isom")), { kind: "video", mimetype: "video/mp4" });
  assert.deepEqual(detectMediaType(ftyp("mp42")), { kind: "video", mimetype: "video/mp4" });
  assert.deepEqual(detectMediaType(ftyp("qt  ")), { kind: "video", mimetype: "video/quicktime" });
  assert.deepEqual(detectMediaType(ftyp("3gp4")), { kind: "video", mimetype: "video/3gpp" });
  assert.deepEqual(detectMediaType(pad("RIFF", Buffer.from([1, 0, 0, 0]), "AVI ")), { kind: "video", mimetype: "video/x-msvideo" });
  const ebml = pad(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  assert.deepEqual(detectMediaType(ebml, "video/webm"), { kind: "video", mimetype: "video/webm" });
});

t("container ambigu mengikuti mimetype kiriman klien (rekaman suara)", () => {
  const ebml = pad(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  assert.deepEqual(detectMediaType(ebml, "audio/webm"), { kind: "audio", mimetype: "audio/webm" });
  assert.deepEqual(detectMediaType(ftyp("isom"), "audio/mp4"), { kind: "audio", mimetype: "audio/mp4" });
  assert.deepEqual(detectMediaType(ftyp("M4A "), "audio/x-m4a"), { kind: "audio", mimetype: "audio/mp4" });
});

t("file palsu atau tidak diizinkan ditolak walau mimetype dipalsukan", () => {
  assert.equal(detectMediaType(Buffer.from("%PDF-1.4 hello world....")), null);
  assert.equal(detectMediaType(Buffer.from("<?php echo 1; ?> aaaaaaaa")), null);
  assert.equal(detectMediaType(Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff", "latin1"), "video/mp4"), null);
  assert.equal(detectMediaType(Buffer.from("GIF89a" + "x".repeat(20)), "image/png"), null);
  assert.equal(detectMediaType(ftyp("heic")), null, "HEIC memakai container MP4 tetapi bukan video");
  assert.equal(detectMediaType(ftyp("avif")), null);
  assert.equal(detectMediaType(Buffer.alloc(4)), null);
  assert.equal(detectMediaType(null), null);
});

t("AI hanya menerima gambar JPG/PNG/WebP", () => {
  assert.ok(isAiImageMime("image/jpeg") && isAiImageMime("image/png") && isAiImageMime("image/webp"));
  assert.equal(isAiImageMime("video/mp4"), false);
  assert.equal(isAiImageMime("audio/mpeg"), false);

  assert.ok(isAiImage({ resource_type: "image", format: "jpg", url: "u" }));
  assert.ok(isAiImage({ resource_type: "image", format: "PNG", url: "u" }));
  assert.ok(isAiImage({ resource_type: "image", format: "webp", url: "u" }));
  assert.ok(isAiImage({ url: "u" }), "dokumen lama tanpa resource_type/format dianggap gambar");
  // Cloudinary menyimpan audio dan video dengan resource_type "video"
  assert.equal(isAiImage({ resource_type: "video", format: "mp4", url: "u" }), false);
  assert.equal(isAiImage({ resource_type: "video", format: "mp3", url: "u" }), false);
  assert.equal(isAiImage({ resource_type: "raw", format: null, url: "u" }), false);
  assert.equal(isAiImage({ resource_type: "image", format: "gif", url: "u" }), false);
  assert.equal(isAiImage(null), false);
  assert.equal(isAiImage("https://x/y.jpg"), false);
});

console.log(`\n${n} test lolos`);