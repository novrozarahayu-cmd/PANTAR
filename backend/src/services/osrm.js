// Klien OSRM (Open Source Routing Machine) di atas data OpenStreetMap.
//
// PENTING: server publik hanya untuk demo/pengembangan (ada pembatasan pemakaian).
// - router.project-osrm.org hanya punya profil mobil, nama profil di URL diabaikan.
// - routing.openstreetmap.de/routed-foot (FOSSGIS) untuk pejalan kaki; instance FOSSGIS memakai
//   nama profil "driving" di URL untuk semua jenis (profil sebenarnya ditentukan oleh instance-nya).
// Untuk produksi, jalankan OSRM sendiri (mobil dan foot) dengan data OSM lalu isi variabel .env di bawah.
//
//   OSRM_URL / OSRM_PROFILE                 -> mobil (dan motor bila OSRM_MOTOR_URL kosong)
//   OSRM_MOTOR_URL / OSRM_MOTOR_PROFILE     -> motor (OSRM tidak punya profil motor bawaan, memakai graf mobil)
//   OSRM_FOOT_URL / OSRM_FOOT_PROFILE       -> pejalan kaki

const DEFAULT_CAR_URL = "https://router.project-osrm.org";
const DEFAULT_FOOT_URL = "https://routing.openstreetmap.de/routed-foot";
const TIMEOUT_MS = Number(process.env.OSRM_TIMEOUT_MS) || 10000;

const stripSlash = (u) => u.replace(/\/$/, "");

const endpointFor = (vehicle) => {
  const carUrl = process.env.OSRM_URL || DEFAULT_CAR_URL;
  const carProfile = process.env.OSRM_PROFILE || "driving";
  switch (vehicle) {
    case "jalan_kaki":
      return {
        url: stripSlash(process.env.OSRM_FOOT_URL || DEFAULT_FOOT_URL),
        profile: process.env.OSRM_FOOT_PROFILE || "driving",
      };
    case "motor":
      return {
        url: stripSlash(process.env.OSRM_MOTOR_URL || carUrl),
        profile: process.env.OSRM_MOTOR_PROFILE || carProfile,
      };
    default:
      return { url: stripSlash(carUrl), profile: carProfile };
  }
};

export class RoutingError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = "RoutingError";
    this.statusCode = statusCode;
  }
}

/**
 * Ambil rute dari OSRM.
 * @param {Array<[number, number]>} points daftar [lng, lat]: asal, (via...), tujuan
 * @param {{alternatives?: boolean, vehicle?: string}} opts alternatif hanya didukung untuk 2 titik
 * @returns {Promise<Array>} array rute OSRM (geometry GeoJSON, distance m, duration detik)
 */
export const fetchRoutes = async (points, { alternatives = false, vehicle = "mobil" } = {}) => {
  const { url: base, profile } = endpointFor(vehicle);
  const coords = points.map(([lng, lat]) => `${lng},${lat}`).join(";");
  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    steps: "false",
    alternatives: alternatives && points.length === 2 ? "3" : "false",
  });
  const url = `${base}/route/v1/${profile}/${coords}?${params}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "pantau-jalan/1.0" } });
  } catch (e) {
    throw new RoutingError(
      e.name === "AbortError"
        ? "Server routing (OSRM) tidak merespons"
        : "Tidak dapat menghubungi server routing (OSRM)",
      502
    );
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => null);
  if (data?.code === "NoRoute") throw new RoutingError("Rute tidak ditemukan di antara kedua titik", 404);
  if (data?.code === "NoSegment") {
    throw new RoutingError("Salah satu titik terlalu jauh dari jalan yang dikenal", 422);
  }
  if (!res.ok || data?.code !== "Ok" || !data.routes?.length) {
    throw new RoutingError(`Server routing mengembalikan error: ${data?.code || res.status}`, 502);
  }
  // waypoints = lokasi asal, via, dan tujuan setelah ditempelkan ke jalan (dipakai untuk membuang lorong buntu)
  return data.routes.map((r) => ({ ...r, waypoints: data.waypoints }));
};

/**
 * Titik jalan terdekat dari sebuah koordinat (OSRM /nearest).
 * @returns {Promise<{distanceM: number, name: string}|null>} null jika server tidak dapat dihubungi.
 *          distanceM = Infinity bila tidak ada jalan di sekitar titik.
 */
export const nearestRoad = async ([lng, lat], { vehicle = "mobil", timeoutMs = TIMEOUT_MS } = {}) => {
  const { url: base, profile } = endpointFor(vehicle);
  try {
    const res = await fetch(`${base}/nearest/v1/${profile}/${lng},${lat}?number=1`, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": "pantau-jalan/1.0" },
    });
    const data = await res.json().catch(() => null);
    if (data?.code === "NoSegment") return { distanceM: Infinity, name: "" };
    if (!res.ok || data?.code !== "Ok" || !data.waypoints?.length) return null;
    return { distanceM: data.waypoints[0].distance, name: data.waypoints[0].name || "" };
  } catch {
    return null;
  }
};
