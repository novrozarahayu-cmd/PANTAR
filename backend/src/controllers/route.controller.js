import { success, error } from "../utils/responseFormatter.js";
import { findSafeRoute, getActiveHazardsGeoJSON } from "../services/safeRoute.js";
import { normalizeVehicle, VEHICLES } from "../utils/vehicle.js";

// Terima { lat, lng } berupa angka atau string; null jika tidak valid.
const parsePoint = (p) => {
  if (!p) return null;
  const lat = parseFloat(p.lat ?? p.latitude);
  const lng = parseFloat(p.lng ?? p.lon ?? p.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
};

// POST /api/routes/safe
// Body: {
//   "origin": { "lat": 3.59, "lng": 98.67 },
//   "destination": { "lat": 3.60, "lng": 98.70 },
//   "vehicle": "mobil" | "motor" | "jalan_kaki"     (opsional, default "mobil")
// }
export const getSafeRoute = async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const origin = parsePoint(body.origin);
    const destination = parsePoint(body.destination);
    if (!origin || !destination) {
      return error(res, {
        message: "origin dan destination wajib berupa koordinat { lat, lng } yang valid",
        statusCode: 422,
      });
    }

    const vehicle = normalizeVehicle(body.vehicle);
    if (!vehicle) {
      return error(res, {
        message: `vehicle tidak dikenal. Pilihan: ${VEHICLES.join(", ")}`,
        statusCode: 422,
      });
    }

    const result = await findSafeRoute(origin, destination, vehicle);
    return success(res, { message: result.message, data: result });
  } catch (err) {
    if (err.name === "RoutingError") {
      return error(res, { message: err.message, statusCode: err.statusCode });
    }
    next(err);
  }
};

// GET /api/routes/hazards?bbox=minLng,minLat,maxLng,maxLat   (bbox opsional)
// Hanya menampilkan laporan berstatus "diproses".
export const getHazards = async (req, res, next) => {
  try {
    let bbox;

    if (req.query.bbox) {
      bbox = String(req.query.bbox).split(",").map(Number);

      if (bbox.length !== 4 || bbox.some((n) => !Number.isFinite(n))) {
        return error(res, {
          message: "bbox harus berformat minLng,minLat,maxLng,maxLat",
          statusCode: 422,
        });
      }
    }

    const geojson = await getActiveHazardsGeoJSON(bbox);

    const data = {
      ...geojson,
      features: (geojson.features ?? []).map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          images: (feature.properties?.images ?? [])
            .map((image) =>
              typeof image === "string" ? image : image?.url
            )
            .filter(Boolean),
        },
      })),
    };

    return success(res, {
      message: "Titik jalan rusak berhasil diambil",
      data,
    });
  } catch (err) {
    next(err);
  }
};