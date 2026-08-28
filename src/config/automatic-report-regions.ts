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
		radiusKm: 100,
		gridSizeKm: 25,
		baselineAqi: 20,
		categories: ["Kebakaran", "Polusi", "Drainase/Banjir"],
	},
	{
		id: "jakarta",
		name: "Jakarta dan sekitarnya",
		enabled: true,
		center: { latitude: -6.2088, longitude: 106.8456 },
		radiusKm: 45,
		gridSizeKm: 10,
		baselineAqi: 70,
		categories: ["Kebakaran", "Polusi", "Drainase/Banjir"],
	},
	{
		id: "bandung",
		name: "Bandung Raya",
		enabled: true,
		center: { latitude: -6.9175, longitude: 107.6191 },
		radiusKm: 45,
		gridSizeKm: 10,
		baselineAqi: 60,
		categories: ["Kebakaran", "Polusi", "Drainase/Banjir"],
	},
	{
		id: "yogyakarta",
		name: "Yogyakarta dan sekitarnya",
		enabled: true,
		center: { latitude: -7.7956, longitude: 110.3695 },
		radiusKm: 45,
		gridSizeKm: 10,
		baselineAqi: 50,
		categories: ["Kebakaran", "Polusi", "Drainase/Banjir"],
	},
	{
		id: "semarang",
		name: "Semarang Raya",
		enabled: true,
		center: { latitude: -6.9667, longitude: 110.4167 },
		radiusKm: 50,
		gridSizeKm: 10,
		baselineAqi: 55,
		categories: ["Kebakaran", "Polusi", "Drainase/Banjir"],
	},
	{
		id: "surabaya",
		name: "Surabaya Raya",
		enabled: true,
		center: { latitude: -7.2575, longitude: 112.7521 },
		radiusKm: 50,
		gridSizeKm: 10,
		baselineAqi: 65,
		categories: ["Kebakaran", "Polusi", "Drainase/Banjir"],
	},
	{
		id: "medan",
		name: "Medan dan Deli Serdang",
		enabled: true,
		center: { latitude: 3.5952, longitude: 98.6722 },
		radiusKm: 60,
		gridSizeKm: 15,
		baselineAqi: 55,
		categories: ["Kebakaran", "Polusi", "Drainase/Banjir"],
	},
	{
		id: "palembang",
		name: "Palembang dan sekitarnya",
		enabled: true,
		center: { latitude: -2.9909, longitude: 104.7566 },
		radiusKm: 70,
		gridSizeKm: 15,
		baselineAqi: 50,
		categories: ["Kebakaran", "Polusi", "Drainase/Banjir"],
	},
	{
		id: "pontianak",
		name: "Pontianak dan Kubu Raya",
		enabled: true,
		center: { latitude: -0.0263, longitude: 109.3425 },
		radiusKm: 75,
		gridSizeKm: 15,
		baselineAqi: 45,
		categories: ["Kebakaran", "Polusi", "Drainase/Banjir"],
	},
	{
		id: "samarinda",
		name: "Samarinda dan Kutai Kartanegara",
		enabled: true,
		center: { latitude: -0.5022, longitude: 117.1536 },
		radiusKm: 75,
		gridSizeKm: 15,
		baselineAqi: 45,
		categories: ["Kebakaran", "Polusi", "Drainase/Banjir"],
	},
	{
		id: "makassar",
		name: "Makassar dan Gowa",
		enabled: true,
		center: { latitude: -5.1477, longitude: 119.4327 },
		radiusKm: 60,
		gridSizeKm: 15,
		baselineAqi: 50,
		categories: ["Kebakaran", "Polusi", "Drainase/Banjir"],
	},
	{
		id: "denpasar",
		name: "Bali Selatan",
		enabled: true,
		center: { latitude: -8.65, longitude: 115.2167 },
		radiusKm: 45,
		gridSizeKm: 10,
		baselineAqi: 45,
		categories: ["Kebakaran", "Polusi", "Drainase/Banjir"],
	},
	{
		id: "kupang",
		name: "Kupang dan sekitarnya",
		enabled: true,
		center: { latitude: -10.1772, longitude: 123.607 },
		radiusKm: 50,
		gridSizeKm: 10,
		baselineAqi: 40,
		categories: ["Kebakaran", "Polusi", "Drainase/Banjir"],
	},
	{
		id: "jayapura",
		name: "Jayapura dan sekitarnya",
		enabled: true,
		center: { latitude: -2.5337, longitude: 140.7181 },
		radiusKm: 60,
		gridSizeKm: 15,
		baselineAqi: 35,
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
