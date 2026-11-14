import Report, { SEVERITY, PUBLIC_VALIDATION_FILTER } from "../models/Report.js";
import { fetchRoutes } from "./osrm.js";
import { nearestOnLine, offsetPerpendicular, bboxPolygon, removeLoopsAtVias } from "../utils/geo.js";
import { blockingSeverities, passableBy } from "../utils/vehicle.js";

const num = (v, fallback) => {
  if (v === undefined || v === "") return fallback;

  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const CFG = {
  statuses: (process.env.ROUTING_BLOCK_STATUSES || "diproses")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  bufferM: num(process.env.ROUTING_BUFFER_METERS, 40),
  detourM: num(process.env.ROUTING_DETOUR_METERS, 400),
  maxIter: num(process.env.ROUTING_MAX_ITER, 3),
  penaltySec: num(process.env.ROUTING_PENALTY_SEC, 120),
  maxDetourFactor: num(process.env.ROUTING_MAX_DETOUR_FACTOR, 2),
};

const WEIGHT = {
  ringan: 1,
  sedang: 3,
  berat: 10,
};

const VEHICLE_LABEL = {
  mobil: "mobil",
  motor: "motor",
  jalan_kaki: "pejalan kaki",
};

// Mengubah format gambar menjadi URL string.
// Cloudinary sudah menyediakan URL lengkap, jadi tidak perlu BASE_URL.
const normalizeImages = (images = []) =>
  images
    .map((image) => {
      if (typeof image === "string") {
        return image;
      }

      if (image && typeof image === "object") {
        return image.url ?? null;
      }

      return null;
    })
    .filter(Boolean);

// Semua laporan aktif yang berada di dekat garis rute.
const findNearbyReports = async (coords) => {
  const candidates = await Report.find({
    status: { $in: CFG.statuses },
    ...PUBLIC_VALIDATION_FILTER,
    type: "jalan",
    location: {
      $geoWithin: {
        $geometry: bboxPolygon(coords, CFG.bufferM * 2),
      },
    },
  })
    .select("title type severity status address location images cost")
    .lean();

  const found = [];

  for (const r of candidates) {
    const [lng, lat] = r.location.coordinates;

    const near = nearestOnLine([lng, lat], coords);

    if (near.distance > CFG.bufferM) continue;

    found.push({
      id: r._id.toString(),
      title: r.title,
      address: r.address,
      type: r.type,
      severity: r.severity,
      status: r.status,
      cost: r.cost,

      // Ambil URL Cloudinary, bukan menggabungkan objek dengan BASE_URL.
      images: normalizeImages(r.images),

      lat,
      lng,
      distanceToRoute: Math.round(near.distance),
      weight: WEIGHT[r.severity] ?? 1,
      position: near.index,
    });
  }

  return found.sort((a, b) => a.position - b.position);
};

// Menghapus bagian rute yang membentuk jalan buntu di titik via.
const trimSpurs = (route, vias) => {
  if (vias.length === 0) return route;

  const snapped =
    route.waypoints?.length === vias.length + 2
      ? route.waypoints.slice(1, -1).map((w) => w.location)
      : vias;

  const { line, removedMeters } = removeLoopsAtVias(
    route.geometry.coordinates,
    snapped
  );

  if (removedMeters === 0) return route;

  const ratio = Math.max(0, 1 - removedMeters / route.distance);

  return {
    ...route,
    distance: route.distance - removedMeters,
    duration: route.duration * ratio,
    geometry: {
      type: "LineString",
      coordinates: line,
    },
  };
};

// Menilai rute berdasarkan laporan yang menghalangi dan yang masih bisa dilewati.
const evaluate = async (rawRoute, blocking, vias = []) => {
  const route = trimSpurs(rawRoute, vias);
  const coords = route.geometry.coordinates;

  const nearby = await findNearbyReports(coords);

  const hazards = nearby.filter((h) =>
    blocking.includes(h.severity)
  );

  const passable = nearby.filter(
    (h) => !blocking.includes(h.severity)
  );

  const hazardScore = hazards.reduce(
    (sum, h) => sum + h.weight,
    0
  );

  return {
    distance: route.distance,
    duration: route.duration,
    geometry: route.geometry,
    coords,
    hazards,
    passable,
    hazardScore,
    cost: route.duration + hazardScore * CFG.penaltySec,
    vias,
  };
};

const pickBest = (list) =>
  list.reduce((a, b) => (b.cost < a.cost ? b : a));

const strip = ({ position, weight, ...hazard }) => hazard;

// Mengubah hasil evaluasi menjadi struktur respons API.
const publicRoute = ({
  distance,
  duration,
  geometry,
  hazards,
  passable,
}) => ({
  distance: Math.round(distance),
  duration: Math.round(duration),
  geometry,
  hazards: hazards.map(strip),
  passableHazards: passable.map(strip),
});

/**
 * Cari rute dari origin ke destination yang menghindari laporan jalan rusak.
 *
 * Strategi:
 * 1. Ambil rute tercepat dan alternatif dari OSRM.
 * 2. Nilai laporan kerusakan yang berada dekat setiap rute.
 * 3. Coba mengalihkan rute melalui titik via di sekitar kerusakan.
 * 4. Pilih rute dengan biaya terendah selama durasinya masih wajar.
 */
export const findSafeRoute = async (
  origin,
  destination,
  vehicle = "mobil"
) => {
  const A = [origin.lng, origin.lat];
  const B = [destination.lng, destination.lat];

  const blocking = blockingSeverities(vehicle, SEVERITY);
  const label = VEHICLE_LABEL[vehicle];

  const osrmRoutes = await fetchRoutes([A, B], {
    alternatives: true,
    vehicle,
  });

  const candidates = await Promise.all(
    osrmRoutes.map((route) => evaluate(route, blocking))
  );

  const baseline = candidates[0];

  const maxDuration = Math.max(
    baseline.duration * CFG.maxDetourFactor,
    baseline.duration + 600
  );

  let best = pickBest(candidates);
  const tried = new Set();

  for (
    let i = 0;
    i < CFG.maxIter && best.hazards.length > 0;
    i++
  ) {
    const target = [...best.hazards]
      .filter((hazard) => !tried.has(hazard.id))
      .sort((a, b) => b.weight - a.weight)[0];

    if (!target) break;

    tried.add(target.id);

    const near = nearestOnLine(
      [target.lng, target.lat],
      best.coords
    );

    const attempts = await Promise.allSettled(
      [1, -1].map(async (side) => {
        const via = offsetPerpendicular(
          near.point,
          near.direction,
          CFG.detourM,
          side
        );

        const vias = [...best.vias, via]
          .map((v) => ({
            v,
            pos: nearestOnLine(v, best.coords).index,
          }))
          .sort((a, b) => a.pos - b.pos)
          .map((item) => item.v);

        const [route] = await fetchRoutes(
          [A, ...vias, B],
          { vehicle }
        );

        return evaluate(route, blocking, vias);
      })
    );

    attempts.forEach((attempt) => {
      if (attempt.status === "rejected") {
        console.warn(
          "[safeRoute] percobaan pengalihan gagal:",
          attempt.reason?.message
        );
      }
    });

    const valid = attempts
      .filter(
        (attempt) =>
          attempt.status === "fulfilled" &&
          attempt.value.duration <= maxDuration
      )
      .map((attempt) => attempt.value);

    if (valid.length === 0) continue;

    const candidate = pickBest(valid);

    if (candidate.cost < best.cost) {
      best = candidate;
    }
  }

  const bestIds = new Set(
    best.hazards.map((hazard) => hazard.id)
  );

  const avoided = baseline.hazards.filter(
    (hazard) => !bestIds.has(hazard.id)
  );

  let status;
  let message;

  if (
    best.hazards.length === 0 &&
    baseline.hazards.length === 0
  ) {
    status = "aman";
    message = `Rute tercepat tidak melewati jalan rusak yang menghalangi ${label}`;
  } else if (best.hazards.length === 0) {
    status = "dialihkan";
    message = `Rute dialihkan untuk menghindari ${avoided.length} titik jalan rusak`;
  } else if (avoided.length > 0) {
    status = "sebagian";
    message = `Rute dialihkan menghindari ${avoided.length} titik, tetapi masih melewati ${best.hazards.length} titik jalan rusak`;
  } else {
    status = "tidak_terhindarkan";
    message =
      "Tidak ditemukan jalur alternatif yang wajar; rute masih melewati jalan rusak";
  }

  if (best.passable.length > 0) {
    message += `. Ada ${best.passable.length} titik jalan rusak di rute yang masih bisa dilewati ${label}`;
  }

  return {
    status,
    message,
    vehicle,

    // Gambar sudah dinormalisasi saat findNearbyReports().
    // publicRoute() mempertahankan URL tersebut.
    route: publicRoute(best),
    baseline: publicRoute(baseline),
    avoided: avoided.map(strip),
  };
};

// Laporan aktif untuk ditampilkan di peta (GeoJSON FeatureCollection).
// Hanya laporan dengan status di CFG.statuses (default: "diproses").
export const getActiveHazardsGeoJSON = async (bbox) => {
  const filter = {
    status: { $in: CFG.statuses },
    ...PUBLIC_VALIDATION_FILTER,
    // type: "jalan",
    "location.coordinates.0": { $exists: true },
  };

  if (bbox) {
    const [w, s, e, n] = bbox;
    filter.location = {
      $geoWithin: {
        $geometry: {
          type: "Polygon",
          coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
        },
      },
    };
  }

  const reports = await Report.find(filter)
    .select("title type severity status address location images cost")
    .limit(1000)
    .lean();

  return {
    type: "FeatureCollection",
    features: reports.map((r) => ({
      type: "Feature",
      geometry: r.location,
      properties: {
        id: r._id.toString(),
        title: r.title,
        type: r.type,
        address: r.address,
        severity: r.severity,
        status: r.status,
        cost: r.cost,
        images: (r.images ?? [])
          .map((image) =>
            typeof image === "string" ? image : image?.url
          )
          .filter(Boolean),
        passableBy: r.type === "jalan" ? passableBy(r.severity) : null,
      },
    })),
  };
};