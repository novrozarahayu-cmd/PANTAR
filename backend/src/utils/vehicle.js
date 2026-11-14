// Jenis pengguna jalan dan tingkat kerusakan yang MASIH BISA mereka lewati.
//
// Kerusakan "ringan" (retak, lubang kecil) masih aman dilewati motor dan pejalan kaki,
// tetapi mobil tetap menghindarinya. Atur lewat .env jika perlu, contoh:
//   ROUTING_PASSABLE_MOTOR=ringan,sedang
//   ROUTING_PASSABLE_JALAN_KAKI=ringan
//   ROUTING_PASSABLE_MOBIL=            (kosong = mobil menghindari semua)

export const VEHICLES = ["mobil", "motor", "jalan_kaki"];

const ALIASES = {
  mobil: "mobil",
  car: "mobil",
  motor: "motor",
  sepeda_motor: "motor",
  jalan_kaki: "jalan_kaki",
  pejalan_kaki: "jalan_kaki",
  pejalan: "jalan_kaki",
  pedestrian: "jalan_kaki",
  foot: "jalan_kaki",
};

/** Normalisasi input kendaraan. Kosong -> "mobil". Tidak dikenal -> null. */
export const normalizeVehicle = (input) => {
  if (input === undefined || input === null || String(input).trim() === "") return "mobil";
  const key = String(input).trim().toLowerCase().replace(/[\s-]+/g, "_");
  return ALIASES[key] ?? null;
};

const csv = (value, fallback) =>
  (value ?? fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const PASSABLE_SEVERITIES = {
  mobil: csv(process.env.ROUTING_PASSABLE_MOBIL, ""),
  motor: csv(process.env.ROUTING_PASSABLE_MOTOR, "ringan"),
  jalan_kaki: csv(process.env.ROUTING_PASSABLE_JALAN_KAKI, "ringan"),
};

/** Tingkat kerusakan yang MENGHALANGI kendaraan tersebut (harus dihindari). */
export const blockingSeverities = (vehicle, allSeverities) =>
  allSeverities.filter((s) => !PASSABLE_SEVERITIES[vehicle].includes(s));

/** Daftar kendaraan yang masih bisa melewati kerusakan dengan tingkat tertentu. */
export const passableBy = (severity) => VEHICLES.filter((v) => PASSABLE_SEVERITIES[v].includes(severity));
