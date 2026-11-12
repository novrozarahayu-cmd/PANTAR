// Utilitas geometri. Semua koordinat memakai format GeoJSON: [lng, lat].
const EARTH_R = 6371000;
const toRad = (d) => (d * Math.PI) / 180;

// Konversi derajat -> meter di sekitar lintang tertentu (proyeksi equirectangular lokal,
// cukup akurat untuk jarak puluhan-ratusan meter).
const metersPerDegree = (lat) => ({
  kx: ((EARTH_R * Math.PI) / 180) * Math.cos(toRad(lat)),
  ky: (EARTH_R * Math.PI) / 180,
});

/**
 * Titik terdekat pada polyline terhadap sebuah titik.
 * Mengembalikan jarak (meter), indeks pecahan sepanjang garis (untuk mengurutkan),
 * titik terdekat, dan vektor arah segmen (dalam meter, [timur, utara]).
 */
export const nearestOnLine = (point, line) => {
  const { kx, ky } = metersPerDegree(point[1]);
  let best = { distance: Infinity, index: 0, point: line[0], direction: [1, 0] };

  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i];
    const b = line[i + 1];
    const ax = (a[0] - point[0]) * kx;
    const ay = (a[1] - point[1]) * ky;
    const bx = (b[0] - point[0]) * kx;
    const by = (b[1] - point[1]) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    const dist = Math.hypot(ax + t * dx, ay + t * dy);

    if (dist < best.distance) {
      best = {
        distance: dist,
        index: i + t,
        point: [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])],
        direction: [dx, dy],
      };
    }
  }
  return best;
};

/** Geser titik tegak lurus terhadap arah (side: 1 = kiri, -1 = kanan). */
export const offsetPerpendicular = (point, direction, meters, side = 1) => {
  const len = Math.hypot(direction[0], direction[1]) || 1;
  const nx = (-direction[1] / len) * side;
  const ny = (direction[0] / len) * side;
  const { kx, ky } = metersPerDegree(point[1]);
  return [point[0] + (nx * meters) / kx, point[1] + (ny * meters) / ky];
};

/** Polygon GeoJSON (kotak) yang membungkus polyline + padding dalam meter. */
export const bboxPolygon = (line, padMeters = 0) => {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of line) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  const { kx, ky } = metersPerDegree((minLat + maxLat) / 2);
  const padLng = padMeters / kx;
  const padLat = padMeters / ky;
  const w = minLng - padLng, e = maxLng + padLng, s = minLat - padLat, n = maxLat + padLat;
  return {
    type: "Polygon",
    coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
  };
};
// Jarak dua titik [lng, lat] dalam meter (lokal, cukup akurat untuk jarak pendek).
const distM = (a, b) => {
  const { kx, ky } = metersPerDegree(a[1]);
  return Math.hypot((a[0] - b[0]) * kx, (a[1] - b[1]) * ky);
};

const keyOf = (p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`;

/**
 * Hapus lorong buntu / putaran yang terbentuk di sekitar titik via.
 *
 * Titik via digeser ke samping dari jalan rusak lalu ditempelkan OSRM ke jalan terdekat. Jika itu jalan
 * buntu, rute masuk sampai ujung, memutar, lalu keluar lewat jalan yang sama (OSRM melarang putar balik
 * di titik via pada profil mobil, jadi putarannya terjadi di ujung buntu, bukan di titik via):
 *   ... J -> a -> via -> b -> ujung -> b -> via -> a -> J ...
 * Rute itu melewati persimpangan J dua kali dengan titik via berada di antaranya. Bagian J..J dibuang
 * dan hanya satu J yang dipertahankan. Ini juga berlaku untuk lorong berujung putaran (lollipop).
 * Hanya siklus yang MEMUAT titik via yang dibuang, jadi putaran sah di rute (mis. memutari blok karena
 * larangan belok) tidak disentuh.
 *
 * @param {Array} line koordinat rute [[lng, lat], ...]
 * @param {Array} viaPoints titik via [lng, lat] (sebaiknya lokasi hasil snap dari OSRM)
 * @returns {{line: Array, removedMeters: number}} garis baru dan panjang yang dibuang
 */
export const removeLoopsAtVias = (line, viaPoints) => {
  let pts = line;
  let removedMeters = 0;

  for (const via of viaPoints) {
    // vertex rute terdekat dengan via
    let v = -1;
    let best = Infinity;
    pts.forEach((p, i) => {
      const d = distM(p, via);
      if (d < best) {
        best = d;
        v = i;
      }
    });
    if (v <= 0 || v >= pts.length - 1) continue; // via di ujung rute

    // indeks semua kemunculan tiap koordinat
    const occurrences = new Map();
    pts.forEach((p, i) => {
      const k = keyOf(p);
      if (!occurrences.has(k)) occurrences.set(k, []);
      occurrences.get(k).push(i);
    });

    // pasangan (i, j) terluar: koordinat sama, i < j, dan v berada di antaranya
    let cut = null;
    for (let i = 0; i < v && !cut; i++) {
      const same = occurrences.get(keyOf(pts[i]));
      const j = same[same.length - 1];
      if (j > i && j >= v) cut = [i, j];
    }
    if (!cut) continue;

    const [i, j] = cut;
    for (let x = i; x < j; x++) removedMeters += distM(pts[x], pts[x + 1]);
    pts = [...pts.slice(0, i + 1), ...pts.slice(j + 1)];
  }

  return { line: pts, removedMeters };
};