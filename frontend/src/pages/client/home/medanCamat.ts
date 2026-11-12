/**
 * Camat 21 kecamatan Kota Medan.
 * Sumber: https://portal.medan.go.id/eselon (Pejabat Eselon, Pemko Medan).
 * Diambil 25 Okt 2026. Pejabat bisa berganti, jadi cek ulang ke sumber resmi
 * sebelum rilis. `camat: null` = belum terverifikasi (halaman sumber gagal dibuka).
 */
export type CamatMedan = {
    kecamatan: string;
    camat: string | null;
};

export const CAMAT_SOURCE_URL = "https://portal.medan.go.id/eselon";

export const camatMedan: CamatMedan[] = [
    { kecamatan: "Medan Amplas", camat: "Zulfahmi Tarigan, SIP, MSP" },
    { kecamatan: "Medan Area", camat: "Dedy Rustam Alamsyah Nasution, S.STP, M.SP" },
    { kecamatan: "Medan Barat", camat: "Maswan Harahap, S.T." },
    { kecamatan: "Medan Baru", camat: "Frans Seno Ranto Haloman Siahaan, S.STP, MSP" },
    { kecamatan: "Medan Belawan", camat: "Robby Kurniawan, SE, MM" },
    { kecamatan: "Medan Deli", camat: "Muhammad Aidiel Putra Pratama, S.STP, M.AP" },
    { kecamatan: "Medan Denai", camat: "Yogi Prayoga, S.IP" },
    { kecamatan: "Medan Helvetia", camat: "Gunawan Perangin Angin, S.T., MM" },
    { kecamatan: "Medan Johor", camat: "Dr. Bachtiar Rivai Nasution, S.STP, M.A.P" },
    { kecamatan: "Medan Kota", camat: "Mhd. Andi Syahputra, S.STP, M.AP" },
    { kecamatan: "Medan Labuhan", camat: "Elias Padang, S.T., M.Si" },
    { kecamatan: "Medan Maimun", camat: "Rizki Hari Adam Lubis, S.STP" },
    { kecamatan: "Medan Marelan", camat: "Dr. Zulkifli Syahputra Pulungan, S.STP, M.AP" },
    { kecamatan: "Medan Perjuangan", camat: "Ika Handayani Tarigan, S.STP, M.Si" },
    { kecamatan: "Medan Petisah", camat: "Syamsul Alam Nasution, S.STP, MAP" },
    { kecamatan: "Medan Polonia", camat: "Noor Alfi Pane, AP" },
    { kecamatan: "Medan Selayang", camat: "Muhammad Husnul Hafis, SSTP, M.AP" },
    { kecamatan: "Medan Sunggal", camat: "Irfan Abdilla, S.STP., M.SP" },
    { kecamatan: "Medan Tembung", camat: "Muhammad Idris, S.H." },
    { kecamatan: "Medan Timur", camat: null },
    { kecamatan: "Medan Tuntungan", camat: "Berani Pa, S.H., M.H." },
];
