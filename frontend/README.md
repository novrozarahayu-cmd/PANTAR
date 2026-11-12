# PantauJalan Frontend

Frontend aplikasi **PantauJalan**, platform untuk menyampaikan laporan kerusakan fasilitas umum, memantau progres penanganan, melihat statistik laporan, dan menggunakan navigasi yang mempertimbangkan titik kerusakan jalan.

## Fitur

### Area masyarakat

- Halaman beranda dan informasi PantauJalan.
- Formulir pengaduan dengan detail kerusakan, foto, tingkat keparahan, dan lokasi.
- Daftar laporan publik dengan pencarian dan filter.
- Detail laporan beserta informasi dan timeline progres perbaikan.
- Navigasi peta untuk memilih lokasi awal dan tujuan, melihat titik kerusakan, serta meminta rute berdasarkan jenis kendaraan.
- Dukungan bahasa Indonesia, English, dan Cakap Medan.

### Area admin/petugas

- Login admin.
- Dashboard ringkasan dan visualisasi statistik laporan.
- Daftar dan detail laporan.
- Pengelolaan status laporan serta progres penanganan/perbaikan.
- Upload foto dokumentasi progres.
- Pembatasan halaman berdasarkan autentikasi dan role.

## Teknologi

- React 19 dan TypeScript
- Vite
- React Router
- Tailwind CSS 4
- Axios
- Leaflet dan React Leaflet
- OpenStreetMap dan OSRM melalui backend
- i18next dan react-i18next
- Framer Motion
- Lucide React
- SweetAlert2

## Persyaratan

- Node.js versi 18 atau lebih baru
- npm
- Backend PantauJalan yang sudah berjalan atau URL API deployment

## Instalasi dan menjalankan

1. Masuk ke direktori frontend:

   ```bash
   cd frontend
   ```

2. Install dependency:

   ```bash
   npm install
   ```

3. Salin `.env.example` menjadi `.env`:

   ```bash
   cp .env.example .env
   ```

4. Isi URL backend pada `.env`:

   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```

   Isi dengan base URL backend tanpa slash di bagian akhir. Untuk deployment, gunakan URL API production.

5. Jalankan development server:

   ```bash
   npm run dev
   ```

Vite akan menampilkan alamat lokal yang dapat dibuka di browser (umumnya `http://localhost:5173`).

## Perintah tersedia

| Perintah          | Keterangan                                                       |
| ----------------- | ---------------------------------------------------------------- |
| `npm run dev`     | Menjalankan development server Vite.                             |
| `npm run build`   | Menjalankan pemeriksaan TypeScript dan membuat build production. |
| `npm run preview` | Menjalankan preview hasil build secara lokal.                    |
| `npm run lint`    | Menjalankan ESLint.                                              |

## Konfigurasi environment

| Variabel            | Wajib | Keterangan                                                    |
| ------------------- | ----: | ------------------------------------------------------------- |
| `VITE_API_BASE_URL` |    Ya | Base URL backend PantauJalan, contoh `http://localhost:5000`. |

Variabel dengan awalan `VITE_` akan terekspos ke bundle frontend. Jangan menyimpan secret, password, private API key, atau kredensial server di environment frontend.

## Struktur direktori

```text
frontend/
├── public/                         # Aset statis dan favicon
├── src/
│   ├── components/                 # Komponen bersama
│   ├── config/                     # Konfigurasi API dan environment
│   ├── i18n/
│   │   ├── locales/                # Terjemahan id, en, dan mdn
│   │   └── index.ts                # Inisialisasi i18next
│   ├── layouts/                    # Layout utama aplikasi
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── api/                # Pemanggilan API area admin
│   │   │   ├── components/         # Komponen admin dan route protection
│   │   │   ├── pages/              # Halaman dashboard dan pengelolaan laporan
│   │   │   ├── types/              # Tipe data admin
│   │   │   └── utils/              # Utilitas autentikasi admin
│   │   └── client/
│   │       ├── home/               # Halaman dan section beranda
│   │       ├── navigation/         # Navigasi, peta, pencarian lokasi, hazards
│   │       └── reports/            # Form, daftar, detail, dan API laporan
│   ├── utils/                      # Utilitas umum
│   ├── App.tsx                     # Konfigurasi route aplikasi
│   ├── index.css                   # Style global
│   └── main.tsx                    # Entry point React
├── .env.example
├── package.json
└── vite.config.ts
```

## Routing halaman

| URL                           | Halaman                        | Akses                                |
| ----------------------------- | ------------------------------ | ------------------------------------ |
| `/`                           | Beranda                        | Publik                               |
| `/form-pengaduan`             | Formulir pengaduan             | Publik                               |
| `/pengaduan`                  | Daftar laporan                 | Publik                               |
| `/pengaduan/:reportId/detail` | Detail laporan dan progres     | Publik                               |
| `/navigasi`                   | Navigasi peta                  | Publik                               |
| `/admin/login`                | Login admin                    | Publik                               |
| `/admin`                      | Dashboard                      | Admin/petugas sesuai aturan proteksi |
| `/admin/reports`              | Daftar laporan admin           | Admin/petugas sesuai aturan proteksi |
| `/admin/reports/:reportId`    | Detail dan pengelolaan laporan | Admin/petugas sesuai aturan proteksi |
| `/403`                        | Halaman akses ditolak          | Publik                               |

Route admin dilindungi oleh `AdminProtectedRoute`. Hak akses akhir tetap divalidasi oleh backend; proteksi frontend bukan pengganti otorisasi API.

## Integrasi API

Seluruh request HTTP menggunakan instance Axios yang didefinisikan di `src/config/api.ts`. Base URL dibaca dari `VITE_API_BASE_URL`.

Token admin yang tersedia pada penyimpanan autentikasi frontend akan ditambahkan ke request sebagai header:

```http
Authorization: Bearer <TOKEN>
```

Jika backend mengembalikan HTTP `403`, interceptor akan mengarahkan pengguna ke halaman `/403`.

Kelompok API backend yang digunakan aplikasi:

- `/api/auth` — autentikasi dan profil.
- `/api/reports` — daftar, detail, pembuatan, perubahan, dan ringkasan laporan.
- `/api/reports/:reportId/progress` dan `/api/progress` — timeline progres perbaikan.
- `/api/routes` — rute aman dan titik kerusakan.
- `/api/users` — pengelolaan pengguna oleh admin.

## Peta dan navigasi

Frontend menggunakan Leaflet/React Leaflet untuk menampilkan peta. Data peta dasar menggunakan OpenStreetMap, sedangkan permintaan rute aman dikirim ke backend. Backend kemudian mengintegrasikan data laporan kerusakan dengan layanan routing OSRM.

Frontend tidak menentukan sendiri apakah sebuah ruas jalan dapat dilewati. Informasi hazard dan hasil perhitungan rute mengikuti response backend.

## Bahasa

Terjemahan disimpan di:

```text
src/i18n/locales/
├── id.json
├── en.json
└── mdn.json
```

Bahasa yang tersedia:

- `id` — Bahasa Indonesia
- `en` — English
- `mdn` — Cakap Medan

Preferensi bahasa disimpan pada `localStorage` dengan key `pantaujalan_lng`. Bahasa fallback adalah Bahasa Indonesia.

Saat menambahkan teks UI baru, tambahkan key terjemahan pada seluruh file locale agar tampilan konsisten.

## Build dan deployment

Buat build production:

```bash
npm run build
```

Hasil build tersedia di direktori `dist/`. Deploy direktori tersebut ke static hosting seperti Vercel atau layanan hosting frontend lainnya.

Pastikan:

1. `VITE_API_BASE_URL` di environment deployment mengarah ke backend production.
2. Backend mengizinkan origin domain frontend melalui konfigurasi CORS.
3. Hosting frontend menerapkan rewrite/fallback ke `index.html` untuk mendukung client-side routing React Router.
4. Backend dan layanan penyimpanan media dapat diakses melalui HTTPS pada deployment production.
