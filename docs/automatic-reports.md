# Laporan terdeteksi otomatis

Worker memantau wilayah pada `src/config/automatic-report-regions.ts`, membentuk kandidat dari NASA FIRMS, AQICN, dan Open-Meteo, lalu menyimpannya pada model `Report` melalui pipeline laporan yang sama dengan laporan manusia.

## Konfigurasi

Isi variabel server berikut:

```env
NASA_FIRMS_MAP_KEY=
AQICN_TOKEN=
GROQ_API_KEY=
AUTOMATIC_REPORT_CRON_SECRET=
AUTOMATIC_REPORT_SYSTEM_EMAIL=monitor@prita.system
AUTOMATIC_REPORT_MAX_GRID_CELLS=12
AUTOMATIC_REPORT_ENABLE_TEST_REGIONS=false
AUTOMATIC_REPORT_REVERSE_GEOCODING_ENABLED=true
AUTOMATIC_REPORT_REVERSE_GEOCODING_URL=https://nominatim.openstreetmap.org
GROQ_AUTOMATIC_REPORT_MODEL=
```

`AUTOMATIC_REPORT_MAX_GRID_CELLS` membatasi jumlah grid yang diperiksa per wilayah pada satu run. Jika jumlah grid lebih besar, worker merotasi subset grid setiap slot tiga jam.

Threshold aktif dibuat cukup sensitif untuk memperbanyak kandidat tanpa menaikkan
semua kandidat menjadi urgensi tinggi:

- Kebakaran: confidence FIRMS minimal 50% dan usia hotspot maksimal 12 jam.
- Polusi: AQI minimal 101 dan minimal 30 poin di atas baseline wilayah.
- Potensi banjir: hujan minimal 10 mm/jam atau rolling 24 jam minimal 50 mm.
- Kandidat pada batas bawah menggunakan urgensi `Sedang`; urgensi naik mengikuti
  confidence, FRP, AQI, dan intensitas hujan.

Untuk pengujian lokal wilayah Kalimantan, tambahkan:

```env
AUTOMATIC_REPORT_ENABLE_TEST_REGIONS=true
AUTOMATIC_REPORT_MAX_GRID_CELLS=12
```

Kemudian jalankan endpoint dengan `regionId` bernilai `kalimantan`.
Wilayah ini memakai radius 400 km untuk FIRMS dan grid 50 km untuk anomali
regional. Flag sebaiknya tetap `false` pada production.

## Test lokal

### 1. Siapkan database

Untuk database baru:

```text
pnpm prisma generate
pnpm prisma db push
```

Untuk database yang sudah berisi laporan, ikuti urutan backfill pada bagian
deployment di bawah sebelum menjalankan `prisma db push`.

### 2. Jalankan aplikasi

```text
pnpm dev
```

Jika `pnpm` tidak tersedia secara global pada Windows:

```text
.\node_modules\.bin\vite.cmd dev --port 3000
```

Setelah mengubah `.env` atau konfigurasi wilayah, restart development server.

### 3. Jalankan satu wilayah secara manual

Contoh Purwokerto dari PowerShell:

```powershell
$headers = @{
  Authorization = "Bearer local-cron-secret"
}

$body = @{
  regionId = "purwokerto"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/internal/automatic-reports/run" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body |
  ConvertTo-Json -Depth 10
```

Nilai `local-cron-secret` harus sama dengan
`AUTOMATIC_REPORT_CRON_SECRET` di `.env`.

Untuk test Kalimantan, aktifkan dahulu:

```env
AUTOMATIC_REPORT_ENABLE_TEST_REGIONS=true
```

Kemudian ganti body menjadi:

```powershell
$body = @{
  regionId = "kalimantan"
} | ConvertTo-Json
```

Untuk memproses seluruh wilayah dengan `enabled: true`, kirim body kosong:

```powershell
$body = "{}"
```

Respons `candidates: 0` bukan kegagalan. Jika `providerErrors` juga kosong, semua
provider berhasil diperiksa tetapi tidak ada kondisi yang melewati threshold.
Error API, data stale, atau masalah provider akan muncul pada `providerErrors`.

## Menambahkan wilayah

Konfigurasi bawaan mencakup beberapa wilayah representatif di Indonesia:

- Jawa: `purwokerto`, `jakarta`, `bandung`, `yogyakarta`, `semarang`, dan
  `surabaya`.
- Sumatra: `medan` dan `palembang`.
- Kalimantan: `pontianak` dan `samarinda`.
- Sulawesi: `makassar`.
- Bali dan Nusa Tenggara: `denpasar` dan `kupang`.
- Papua: `jayapura`.
- Cakupan `kalimantan` beradius besar hanya aktif jika
  `AUTOMATIC_REPORT_ENABLE_TEST_REGIONS=true`.

Untuk test lokal, sebaiknya panggil satu `regionId` terlebih dahulu. Body kosong
akan memindai seluruh wilayah aktif; dengan batas 12 grid per wilayah, satu run
nasional dapat memeriksa sampai 168 grid dan memerlukan lebih banyak request
Open-Meteo serta AQICN.

Wilayah baru ditambahkan ke `AUTOMATIC_REPORT_REGIONS` pada
`src/config/automatic-report-regions.ts`. Mengirim `regionId` pada endpoint tidak
akan membuat konfigurasi wilayah secara otomatis.

Contoh wilayah production:

```ts
{
  id: "jakarta",
  name: "DKI Jakarta",
  enabled: true,
  center: {
    latitude: -6.2088,
    longitude: 106.8456,
  },
  radiusKm: 30,
  gridSizeKm: 5,
  baselineAqi: 70,
  categories: ["Polusi", "Drainase/Banjir"],
},
```

Contoh wilayah yang hanya aktif untuk test lokal:

```ts
{
  id: "jakarta-test",
  name: "DKI Jakarta (Test Lokal)",
  enabled: process.env.AUTOMATIC_REPORT_ENABLE_TEST_REGIONS === "true",
  center: {
    latitude: -6.2088,
    longitude: 106.8456,
  },
  radiusKm: 30,
  gridSizeKm: 5,
  baselineAqi: 70,
  categories: ["Polusi", "Drainase/Banjir"],
},
```

Aturan konfigurasi:

- `id` wajib unik dan hanya menggunakan huruf kecil, angka, serta tanda hubung.
- `name` adalah nama cakupan pemantauan dan fallback detector, bukan nama lokasi
  akhir laporan.
- `center` adalah pusat wilayah, bukan koordinat laporan yang dibuat AI.
- `radiusKm` menentukan batas hotspot dan centroid grid yang diterima.
- `gridSizeKm` menentukan resolusi anomali regional. Grid 5 km memiliki radius
  ketidakpastian sekitar 3,536 km.
- `baselineAqi` menjadi pembanding kenaikan AQI wilayah.
- Kategori aktif V1 adalah `Kebakaran`, `Polusi`, dan `Drainase/Banjir`.
- `Sampah` serta `Fasilitas Rusak` dikenali tetapi detector-nya belum aktif.
- Ukuran grid yang kecil pada radius besar menghasilkan banyak request provider.
  Jumlah grid per run tetap dibatasi `AUTOMATIC_REPORT_MAX_GRID_CELLS`.

Tidak perlu membuat file test baru untuk setiap wilayah. Setelah konfigurasi
ditambahkan dan server direstart, panggil endpoint menggunakan ID yang sama:

```json
{ "regionId": "jakarta" }
```

Jika ID belum terdaftar atau wilayah tersebut tidak aktif, endpoint mengembalikan
`AUTOMATIC_REPORT_REGION_NOT_FOUND:<regionId>`.

Sebelum mengaktifkan wilayah production, periksa titik pusat dan radius agar tidak
mencakup negara, laut, atau provinsi lain yang tidak dimaksud.

## Nama lokasi laporan

Nama lokasi akhir ditentukan dari koordinat kandidat setelah kandidat melewati
threshold dan pemeriksaan deduplikasi. Dengan begitu, `center` hanya menjadi
patokan wilayah pemantauan: hotspot FIRMS dapat bernama sesuai desa/kecamatan di
titik hotspot, sedangkan anomali regional dapat bernama sesuai area centroid grid.

Worker melakukan reverse geocoding server-side dan menyusun nama dari area lokal,
kecamatan/kota, kabupaten, serta provinsi yang tersedia. Jika provider tidak dapat
diakses, worker memakai nama kota Indonesia terdekat sebagai fallback, misalnya
`Sekitar Palangka Raya, Kalimantan Tengah`. Koordinat tidak pernah dipindahkan oleh
reverse geocoder maupun AI.

Pada endpoint publik Nominatim, request hanya dilakukan untuk kandidat laporan
yang sudah valid, dijalankan serial sekitar 3,75 request per menit, dan hasilnya
disimpan pada `Report.sourceMetadata`. Untuk volume production yang besar, arahkan
`AUTOMATIC_REPORT_REVERSE_GEOCODING_URL` ke instance sendiri atau provider yang
sesuai. Set `AUTOMATIC_REPORT_REVERSE_GEOCODING_ENABLED=false` untuk menonaktifkan
provider eksternal dan selalu memakai fallback lokal. Penggunaan endpoint publik
harus mengikuti [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
dan hasil OpenStreetMap tetap menampilkan atribusi provider.

## Deployment database

Untuk database yang sudah memiliki laporan, jalankan backfill **sebelum** membuat
unique index baru. Urutan deployment:

```text
pnpm prisma generate
pnpm db:backfill-report-provenance
pnpm prisma db push
```

Backfill memberi `source = HUMAN` dan key `legacy:<report-id>` pada laporan lama.
Jangan menjalankan `prisma db push` lebih dahulu karena beberapa dokumen lama yang
belum memiliki key dapat menggagalkan pembuatan unique index.

Setelah perubahan schema diterapkan dan aplikasi dideploy, panggil endpoint berikut setiap tiga jam:

```text
POST /api/internal/automatic-reports/run
Authorization: Bearer <AUTOMATIC_REPORT_CRON_SECRET>
Content-Type: application/json

{}
```

Cron expression: `0 */3 * * *`. Workflow `.github/workflows/automatic-reports.yml`
telah menyiapkan jadwal tersebut. Tambahkan repository secrets:

- `AUTOMATIC_REPORT_BASE_URL`: origin deployment, misalnya `https://prita.example`.
- `AUTOMATIC_REPORT_CRON_SECRET`: nilai yang sama dengan environment server.

Untuk menjalankan satu wilayah secara manual, kirim body `{"regionId":"purwokerto"}` dengan header otorisasi yang sama.

## Semantik data

- `source = ENVIRONMENT_MONITOR` membedakan provenance tanpa membuat koleksi laporan terpisah.
- `VERIFIED` berarti bukti sensor memenuhi threshold detector, bukan konfirmasi saksi manusia.
- Koordinat hotspot berasal dari FIRMS. Anomali regional menggunakan centroid grid dan menyimpan radius ketidakpastian.
- AI hanya menyusun judul serta deskripsi. Kategori, urgensi, status, koordinat, confidence, dan bukti tetap ditentukan detector.
- Kegagalan AI memakai narasi deterministik; kegagalan satu provider atau wilayah tidak membatalkan seluruh run.

Respons endpoint mencantumkan `runId`, waktu mulai/selesai, jumlah wilayah, kandidat, laporan dibuat/diperbarui/dilewati, dan error provider.
