/**
 * Daftar resmi 21 kecamatan dan 151 kelurahan Kota Medan.
 * Sumber: daftar administratif Kota Medan (21 kecamatan / 151 kelurahan).
 */
export type MedanDistrict = { name: string; villages: string[] };

export const MEDAN_REGIONS: MedanDistrict[] = [
  {
    name: "Medan Amplas",
    villages: [
      "Amplas",
      "Bangun Mulia",
      "Harjosari I",
      "Harjosari II",
      "Sitirejo II",
      "Sitirejo III",
      "Timbang Deli",
    ],
  },
  {
    name: "Medan Area",
    villages: [
      "Kotamatsum I",
      "Kotamatsum II",
      "Kotamatsum IV",
      "Tegal Sari I",
      "Tegal Sari II",
      "Tegal Sari III",
      "Pandau Hulu II",
      "Sei Rengas II",
      "Sei Rengas Permata",
      "Pasar Merah Timur",
      "Sukaramai I",
      "Sukaramai II",
    ],
  },
  {
    name: "Medan Barat",
    villages: [
      "Glugur Kota",
      "Karang Berombak",
      "Kesawan",
      "Pulo Brayan Kota",
      "Sei Agul",
      "Silalas",
    ],
  },
  {
    name: "Medan Baru",
    villages: [
      "Babura",
      "Darat",
      "Merdeka",
      "Padang Bulan",
      "Petisah Hulu",
      "Titi Rantai",
    ],
  },
  {
    name: "Medan Belawan",
    villages: [
      "Bagan Deli",
      "Belawan Bahagia",
      "Belawan Bahari",
      "Belawan Sicanang",
      "Belawan I",
      "Belawan II",
    ],
  },
  {
    name: "Medan Deli",
    villages: [
      "Kota Bangun",
      "Mabar",
      "Mabar Hilir",
      "Tanjung Mulia",
      "Tanjung Mulia Hilir",
      "Titi Papan",
    ],
  },
  {
    name: "Medan Denai",
    villages: [
      "Binjai",
      "Denai",
      "Medan Tenggara",
      "Tegalsari Mandala I",
      "Tegalsari Mandala II",
      "Tegalsari Mandala III",
    ],
  },
  {
    name: "Medan Helvetia",
    villages: [
      "Cinta Damai",
      "Dwikora",
      "Helvetia",
      "Helvetia Tengah",
      "Helvetia Timur",
      "Sei Sikambing C II",
      "Tanjung Gusta",
    ],
  },
  {
    name: "Medan Johor",
    villages: [
      "Gedung Johor",
      "Kedai Durian",
      "Kwala Bekala",
      "Pangkalan Mansyur",
      "Sukamaju",
      "Titi Kuning",
    ],
  },
  {
    name: "Medan Kota",
    villages: [
      "Kotamatsum III",
      "Mesjid",
      "Pandau Hulu I",
      "Pasar Baru",
      "Pasar Merah Barat",
      "Pusat Pasar",
      "Sei Rengas I",
      "Sitirejo I",
      "Sudirejo I",
      "Sudirejo II",
      "Teladan Barat",
      "Teladan Timur",
    ],
  },
  {
    name: "Medan Labuhan",
    villages: [
      "Besar",
      "Martubung",
      "Nelayan Indah",
      "Pekan Labuhan",
      "Sei Mati",
      "Tangkahan",
    ],
  },
  {
    name: "Medan Maimun",
    villages: ["Aur", "Hamdan", "Jati", "Kampung Baru", "Sei Mati", "Sukaraja"],
  },
  {
    name: "Medan Marelan",
    villages: [
      "Labuhan Deli",
      "Paya Pasir",
      "Rengas Pulau",
      "Tanah Enam Ratus",
      "Terjun",
    ],
  },
  {
    name: "Medan Perjuangan",
    villages: [
      "Tegal Rejo",
      "Sidorame Barat I",
      "Sidorame Barat II",
      "Sidorame Timur",
      "Sei Kera Hilir I",
      "Sei Kera Hilir II",
      "Sei Kera Hulu",
      "Pahlawan",
      "Pandau Hilir",
    ],
  },
  {
    name: "Medan Petisah",
    villages: [
      "Petisah Tengah",
      "Sei Putih Barat",
      "Sei Putih Tengah",
      "Sei Putih Timur I",
      "Sei Putih Timur II",
      "Sei Sikambing D",
      "Sekip",
    ],
  },
  {
    name: "Medan Polonia",
    villages: ["Anggrung", "Madras Hulu", "Polonia", "Sari Rejo", "Suka Damai"],
  },
  {
    name: "Medan Selayang",
    villages: [
      "Asam Kumbang",
      "Beringin",
      "Padang Bulan Selayang I",
      "Padang Bulan Selayang II",
      "Sempakata",
      "Tanjung Sari",
    ],
  },
  {
    name: "Medan Sunggal",
    villages: [
      "Babura Sunggal",
      "Lalang",
      "Sei Sikambing B",
      "Simpang Tanjung",
      "Sunggal",
      "Tanjung Rejo",
    ],
  },
  {
    name: "Medan Tembung",
    villages: [
      "Bandar Selamat",
      "Bantan",
      "Bantan Timur",
      "Indra Kasih",
      "Sidorejo",
      "Sidorejo Hilir",
      "Tembung",
    ],
  },
  {
    name: "Medan Timur",
    villages: [
      "Durian",
      "Gaharu",
      "Gang Buntu",
      "Glugur Darat I",
      "Glugur Darat II",
      "Perintis",
      "Pulo Brayan Bengkel",
      "Pulo Brayan Bengkel Baru",
      "Pulo Brayan Darat I",
      "Pulo Brayan Darat II",
      "Sidodadi",
    ],
  },
  {
    name: "Medan Tuntungan",
    villages: [
      "Baru Ladang Bambu",
      "Kemenangan Tani",
      "Lau Cih",
      "Mangga",
      "Namo Gajah",
      "Sidomulyo",
      "Simalingkar B",
      "Simpang Selayang",
      "Tanjung Selamat",
    ],
  },
];

/** Samakan penulisan nama: huruf kecil, tanpa tanda baca, tanpa awalan "Kecamatan"/"Kelurahan". */
export function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(kecamatan|kelurahan|kec|kel)\b\.?/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Nama kecamatan dibandingkan tanpa awalan "Medan" ("Medan Area" == "Area"). */
export function normalizeDistrict(value: string) {
  return normalizeName(value).replace(/^medan /, "");
}
