export const AUTOMATIC_REPORT_CATEGORIES = [
  "Sampah",
  "Drainase/Banjir",
  "Polusi",
  "Kebakaran",
  "Fasilitas Rusak",
] as const;

export type AutomaticReportCategory =
  (typeof AUTOMATIC_REPORT_CATEGORIES)[number];

export type AutomaticReportRegion = {
  id: string;
  name: string;
  enabled: boolean;
  center: {
    latitude: number;
    longitude: number;
  };
  radiusKm: number;
  gridSizeKm: number;
  baselineAqi?: number;
  categories: AutomaticReportCategory[];
};

/**
 * Daftar ini adalah satu-satunya sumber cakupan worker laporan otomatis.
 * Tambahkan atau nonaktifkan wilayah tanpa mengubah detection engine.
 */
export const AUTOMATIC_REPORT_REGIONS: AutomaticReportRegion[] = [
  {
    id: "purwokerto",
    name: "Purwokerto, Banyumas",
    enabled: true,
    center: {
      latitude: -7.424,
      longitude: 109.239,
    },
    radiusKm: 400,
    gridSizeKm: 50,
    baselineAqi: 20,
    categories: ["Kebakaran", "Polusi", "Drainase/Banjir"],
  },
  {
    id: "kalimantan",
    name: "Kalimantan",
    enabled: process.env.AUTOMATIC_REPORT_ENABLE_TEST_REGIONS === "true",
    center: {
      latitude: -1.5,
      longitude: 114.5,
    },
    radiusKm: 400,
    gridSizeKm: 50,
    baselineAqi: 50,
    categories: ["Kebakaran", "Polusi", "Drainase/Banjir"],
  },
];

export function validateAutomaticReportRegions(
  regions: AutomaticReportRegion[],
): AutomaticReportRegion[] {
  const knownCategories = new Set<string>(AUTOMATIC_REPORT_CATEGORIES);
  const ids = new Set<string>();

  for (const region of regions) {
    if (!/^[a-z0-9-]+$/.test(region.id)) {
      throw new Error(`ID wilayah tidak valid: ${region.id}`);
    }
    if (ids.has(region.id)) {
      throw new Error(`ID wilayah duplikat: ${region.id}`);
    }
    ids.add(region.id);

    if (!region.name.trim()) {
      throw new Error(`Nama wilayah wajib diisi: ${region.id}`);
    }
    if (
      !Number.isFinite(region.center.latitude) ||
      region.center.latitude < -90 ||
      region.center.latitude > 90 ||
      !Number.isFinite(region.center.longitude) ||
      region.center.longitude < -180 ||
      region.center.longitude > 180
    ) {
      throw new Error(`Koordinat wilayah tidak valid: ${region.id}`);
    }
    if (!Number.isFinite(region.radiusKm) || region.radiusKm <= 0) {
      throw new Error(`Radius wilayah tidak valid: ${region.id}`);
    }
    if (!Number.isFinite(region.gridSizeKm) || region.gridSizeKm <= 0) {
      throw new Error(`Ukuran grid tidak valid: ${region.id}`);
    }
    if (
      region.baselineAqi !== undefined &&
      (!Number.isFinite(region.baselineAqi) ||
        region.baselineAqi < 0 ||
        region.baselineAqi > 500)
    ) {
      throw new Error(`Baseline AQI tidak valid: ${region.id}`);
    }
    if (region.categories.length === 0) {
      throw new Error(`Kategori wilayah tidak boleh kosong: ${region.id}`);
    }
    for (const category of region.categories) {
      if (!knownCategories.has(category)) {
        throw new Error(`Kategori wilayah tidak dikenal: ${category}`);
      }
    }
  }

  return regions;
}

validateAutomaticReportRegions(AUTOMATIC_REPORT_REGIONS);
