# Prita — Asisten Lingkungan

Aplikasi pelaporan dan pemantauan lingkungan berbasis komunitas dengan analisis risiko AI.

## Getting Started

```bash
pnpm install
cp .env.example .env  # lalu isi value-nya
pnpm db:push          # push schema ke MongoDB
pnpm dev
```

## Environment Variables

### Wajib

| Variable | Keterangan |
|----------|------------|
| `DATABASE_URL` | MongoDB connection string |
| `GROQ_API_KEY` | Groq API key untuk AI analysis |
| `AQICN_TOKEN` | AQICN/WAQI token untuk data kualitas udara |
| `NASA_FIRMS_MAP_KEY` | NASA FIRMS API key untuk deteksi hotspot kebakaran |

### Opsi

| Variable | Default | Keterangan |
|----------|---------|------------|
| `VITE_MAPTILER_API_KEY` | — | MapTiler key untuk peta (opsional, fallback ke OSM) |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | — | Cloudflare R2 untuk upload gambar |

## Automatic Reports (Cron)

Prita memiliki sistem laporan otomatis yang mendeteksi kondisi lingkungan (banjir, kebakaran, polusi udara) dari data Open-Meteo, AQICN, dan NASA FIRMS, lalu otomatis membuat laporan.

### Environment Variables

| Variable | Default | Keterangan |
|----------|---------|------------|
| `AUTOMATIC_REPORT_CRON_SECRET` | **wajib** | Secret token untuk auth cron request |
| `AUTOMATIC_REPORT_SYSTEM_EMAIL` | `monitor@prita.system` | Email system user untuk laporan otomatis |
| `AUTOMATIC_REPORT_MAX_GRID_CELLS` | `12` | Max grid cell yang diproses per run |
| `AUTOMATIC_REPORT_ENABLE_TEST_REGIONS` | `false` | Aktifkan test region (Kalimantan) |
| `AUTOMATIC_REPORT_REVERSE_GEOCODING_ENABLED` | `true` | Aktifkan reverse geocoding via Nominatim |
| `AUTOMATIC_REPORT_REVERSE_GEOCODING_URL` | `https://nominatim.openstreetmap.org` | Nominatim endpoint |

### Cara Trigger Manual

```bash
# Jalankan untuk semua region
curl -X POST http://localhost:3000/api/internal/automatic-reports/run \
  -H "Authorization: Bearer local-cron-secret"

# Jalankan untuk 1 region
curl -X POST http://localhost:3000/api/internal/automatic-reports/run \
  -H "Authorization: Bearer local-cron-secret" \
  -H "Content-Type: application/json" \
  -d '{"regionId":"purwokerto"}'
```

### Konfigurasi Cron Service

Untuk menjalankan otomatis secara berkala, setup cron di platform hosting (Vercel, Railway, Cloudflare Workers, dll):

| Setting | Rekomendasi |
|---------|-------------|
| Schedule | Setiap 30-60 menit |
| Endpoint | `POST /api/internal/automatic-reports/run` |
| Auth Header | `Authorization: Bearer <AUTOMATIC_REPORT_CRON_SECRET>` |
| Timeout | 60 detik |

Contoh cron expression (setiap 30 menit):
```
*/30 * * * *
```

### Region yang Dipantau

| Region | Kategori | Radius |
|--------|----------|--------|
| Purwokerto | Kebakaran, Polusi, Drainase/Banjir | 100 km |
| Jakarta | Kebakaran, Polusi, Drainase/Banjir | 45 km |
| Bandung | Polusi, Drainase/Banjir | 35 km |
| Yogyakarta | Drainase/Banjir, Polusi | 30 km |
| Semarang | Drainase/Banjir, Polusi | 35 km |
| Surabaya | Polusi, Drainase/Banjir | 40 km |
| Medan | Polusi, Kebakaran | 40 km |
| Palembang | Polusi, Drainase/Banjir | 35 km |
| Pontianak | Kebakaran, Polusi | 50 km |
| Samarinda | Kebakaran, Polusi | 50 km |
| Makassar | Polusi, Drainase/Banjir | 40 km |
| Denpasar | Polusi, Drainase/Banjir | 35 km |
| Kupang | Polusi, Drainase/Banjir | 40 km |
| Jayapura | Polusi, Drainase/Banjir | 40 km |

## Tech Stack

### Core

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| React | 19.2 | UI library |
| TypeScript | 6.0 | Type safety |
| Vite | 8.0 | Build tool & dev server |
| Node.js | — | Server runtime |

### Framework & Routing

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| TanStack Start | latest | Full-stack React framework (SSR/SSG) |
| TanStack Router | latest | File-based routing, type-safe navigation |
| Nitro | 3.0 beta | Server adapter (deploy ke Vercel, Cloudflare, Node, dll) |

### UI & Styling

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| Tailwind CSS | 4.1 | Utility-first CSS |
| shadcn/ui | 4.16 | Komponen UI (Base UI variant) |
| Lucide React | 1.27 | Icon library |
| Framer Motion | 12.43 | Animasi |
| Recharts | 3.8 | Chart & grafik |
| MapLibre GL JS | 6.1 | Peta interaktif (OpenStreetMap) |
| cmdk | 1.1 | Command palette |
| Embla Carousel | 8.6 | Carousel |
| React Resizable Panels | 4.12 | Resizable layout |
| tw-animate-css | 1.4 | Tailwind animasi |

### Database & ORM

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| MongoDB | 7.5 | Database (via driver) |
| Prisma | 6.19 | ORM + schema management |

### Authentication

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| Better Auth | 1.6 | Email/password + Google OAuth |
| @better-auth/prisma-adapter | 1.6 | Prisma adapter untuk Better Auth |

### AI & LLM

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| Groq SDK | 1.5 | AI inference (cepat, gratis tier) |
| Qwen 3.6-27B | — | Vision model (EcoLens photo analysis) |
| Llama 3.3-70B | — | Text model (risk assessment, insight generation) |

### Data & Storage

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| @aws-sdk/client-s3 | 3.1119 | Cloudflare R2 (S3-compatible) untuk gambar |
| Open-Meteo | API | Data cuaca (gratis, no key) |
| AQICN / WAQI | API | Kualitas udara (butuh token) |
| NASA FIRMS | API | Hotspot kebakaran (VIIRS SNPP NRT) |
| Nominatim | API | Reverse geocoding (OpenStreetMap) |

### Dev Tools

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| Biome | 2.4 | Linter & formatter |
| tsx | 4.23 | TypeScript execution (test, scripts) |
| Prisma CLI | 6.19 | Schema push, generate, seed |
| vite-plugin-image-optimizer | 2.0 | Optimasi gambar saat build |
| sharp | 0.35 | Image processing |
| svgo | 4.0 | SVG optimization |
| Prettier | 3.9 | Code formatter (opsional) |
| ESLint | 10.8 | Linter (opsional, Biome lebih utama) |

### State & Data Fetching

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| TanStack Query | 5.102 | Server state management (optional) |
| TanStack React Query | 5.102 | React bindings |
| TanStack React Devtools | latest | Devtools untuk router & query |

### Fonts

| Font | Keterangan |
|------|------------|
| Geist Variable | Primary font |
| Noto Sans Variable | Fallback / alternate |

## Build & Deploy

```bash
pnpm build
node dist/server/index.mjs
```

Output build adalah Node server yang self-contained. Deploy `dist/` ke host pilihan (Render, Fly.io, VPS, dll).

## Linting

```bash
pnpm lint
pnpm format
pnpm check
```
