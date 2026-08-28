export type LocationData = {
  name: string;
  province: string;
  latitude: number;
  longitude: number;
};

// Comprehensive list of Indonesian cities (Provincial capitals + major cities)
export const INDONESIA_LOCATIONS: LocationData[] = [
  // Sumatera
  { name: "Banda Aceh", province: "Aceh", latitude: 5.5483, longitude: 95.3238 },
  { name: "Medan", province: "Sumatera Utara", latitude: 3.5952, longitude: 98.6722 },
  { name: "Pematangsiantar", province: "Sumatera Utara", latitude: 2.9597, longitude: 99.0614 },
  { name: "Padang", province: "Sumatera Barat", latitude: -0.9471, longitude: 100.4172 },
  { name: "Bukittinggi", province: "Sumatera Barat", latitude: -0.3055, longitude: 100.3693 },
  { name: "Pekanbaru", province: "Riau", latitude: 0.5071, longitude: 101.4478 },
  { name: "Dumai", province: "Riau", latitude: 1.6812, longitude: 101.4478 },
  { name: "Jambi", province: "Jambi", latitude: -1.6101, longitude: 103.6131 },
  { name: "Palembang", province: "Sumatera Selatan", latitude: -2.9761, longitude: 104.7754 },
  { name: "Bengkulu", province: "Bengkulu", latitude: -3.7928, longitude: 102.2608 },
  { name: "Bandar Lampung", province: "Lampung", latitude: -5.4292, longitude: 105.2625 },
  { name: "Batam", province: "Kepulauan Riau", latitude: 1.0456, longitude: 104.0305 },
  { name: "Tanjungpinang", province: "Kepulauan Riau", latitude: 0.9187, longitude: 104.4583 },
  { name: "Pangkal Pinang", province: "Bangka Belitung", latitude: -2.1316, longitude: 106.1169 },

  // Jawa
  { name: "Jakarta", province: "DKI Jakarta", latitude: -6.2088, longitude: 106.8456 },
  { name: "Jakarta Utara", province: "DKI Jakarta", latitude: -6.1384, longitude: 106.8630 },
  { name: "Jakarta Barat", province: "DKI Jakarta", latitude: -6.1677, longitude: 106.7637 },
  { name: "Jakarta Selatan", province: "DKI Jakarta", latitude: -6.2615, longitude: 106.8106 },
  { name: "Jakarta Timur", province: "DKI Jakarta", latitude: -6.2250, longitude: 106.9004 },
  { name: "Jakarta Pusat", province: "DKI Jakarta", latitude: -6.1862, longitude: 106.8341 },
  { name: "Bogor", province: "Jawa Barat", latitude: -6.5950, longitude: 106.8166 },
  { name: "Depok", province: "Jawa Barat", latitude: -6.4025, longitude: 106.7942 },
  { name: "Bandung", province: "Jawa Barat", latitude: -6.9175, longitude: 107.6191 },
  { name: "Cimahi", province: "Jawa Barat", latitude: -6.8724, longitude: 107.5424 },
  { name: "Bekasi", province: "Jawa Barat", latitude: -6.2383, longitude: 106.9756 },
  { name: "Cirebon", province: "Jawa Barat", latitude: -6.7063, longitude: 108.5571 },
  { name: "Tasikmalaya", province: "Jawa Barat", latitude: -7.3267, longitude: 108.2207 },
  { name: "Sukabumi", province: "Jawa Barat", latitude: -6.9278, longitude: 106.9271 },
  { name: "Semarang", province: "Jawa Tengah", latitude: -6.9667, longitude: 110.4167 },
  { name: "Surakarta", province: "Jawa Tengah", latitude: -7.5755, longitude: 110.8243 },
  { name: "Yogyakarta", province: "DI Yogyakarta", latitude: -7.7956, longitude: 110.3695 },
  { name: "Magelang", province: "Jawa Tengah", latitude: -7.4797, longitude: 110.2178 },
  { name: "Surabaya", province: "Jawa Timur", latitude: -7.2575, longitude: 112.7521 },
  { name: "Malang", province: "Jawa Timur", latitude: -7.9797, longitude: 112.6304 },
  { name: "Kediri", province: "Jawa Timur", latitude: -7.8167, longitude: 112.0167 },
  { name: "Probolinggo", province: "Jawa Timur", latitude: -7.7543, longitude: 113.2159 },
  { name: "Banyuwangi", province: "Jawa Timur", latitude: -8.2193, longitude: 114.3675 },
  { name: "Serang", province: "Banten", latitude: -6.1204, longitude: 106.1504 },
  { name: "Tangerang", province: "Banten", latitude: -6.1781, longitude: 106.6300 },
  { name: "Tangerang Selatan", province: "Banten", latitude: -6.2875, longitude: 106.7174 },
  { name: "Cilegon", province: "Banten", latitude: -6.0022, longitude: 106.0194 },

  // Kalimantan
  { name: "Pontianak", province: "Kalimantan Barat", latitude: -0.0263, longitude: 109.3425 },
  { name: "Singkawang", province: "Kalimantan Barat", latitude: 0.9063, longitude: 108.9896 },
  { name: "Palangkaraya", province: "Kalimantan Tengah", latitude: -2.2089, longitude: 113.9141 },
  { name: "Banjarmasin", province: "Kalimantan Selatan", latitude: -3.3194, longitude: 114.5906 },
  { name: "Samarinda", province: "Kalimantan Timur", latitude: -0.5022, longitude: 117.1536 },
  { name: "Balikpapan", province: "Kalimantan Timur", latitude: -1.2379, longitude: 116.8529 },
  { name: "Tarakan", province: "Kalimantan Utara", latitude: 3.3000, longitude: 117.6333 },

  // Sulawesi
  { name: "Manado", province: "Sulawesi Utara", latitude: 1.4748, longitude: 124.8421 },
  { name: "Gorontalo", province: "Gorontalo", latitude: 0.5436, longitude: 123.0595 },
  { name: "Palu", province: "Sulawesi Tengah", latitude: -0.8999, longitude: 119.8707 },
  { name: "Makassar", province: "Sulawesi Selatan", latitude: -5.1477, longitude: 119.4327 },
  { name: "Kendari", province: "Sulawesi Tenggara", latitude: -3.9450, longitude: 122.5989 },
  { name: "Mamuju", province: "Sulawesi Barat", latitude: -2.6737, longitude: 118.8893 },

  // Bali & Nusa Tenggara
  { name: "Denpasar", province: "Bali", latitude: -8.6705, longitude: 115.2126 },
  { name: "Mataram", province: "Nusa Tenggara Barat", latitude: -8.5833, longitude: 116.1167 },
  { name: "Kupang", province: "Nusa Tenggara Timur", latitude: -10.1718, longitude: 123.6075 },

  // Maluku & Papua
  { name: "Ambon", province: "Maluku", latitude: -3.6954, longitude: 128.1814 },
  { name: "Ternate", province: "Maluku Utara", latitude: 0.7896, longitude: 127.3686 },
  { name: "Jayapura", province: "Papua", latitude: -2.5489, longitude: 140.7182 },
  { name: "Sorong", province: "Papua Barat", latitude: -0.8667, longitude: 131.2500 },
  { name: "Manokwari", province: "Papua Barat", latitude: -0.8614, longitude: 134.0640 },
  { name: "Merauke", province: "Papua Selatan", latitude: -8.4667, longitude: 140.4000 },
  { name: "Timika", province: "Papua Tengah", latitude: -4.5397, longitude: 136.8883 },
  { name: "Nabire", province: "Papua Tengah", latitude: -3.3667, longitude: 135.4833 },
  { name: "Biak", province: "Papua", latitude: -1.1833, longitude: 136.0833 },
  { name: "Wamena", province: "Papua Pegunungan", latitude: -4.0949, longitude: 138.9494 },
];

// Group locations by province for dropdown organization
export const LOCATIONS_BY_PROVINCE = INDONESIA_LOCATIONS.reduce((acc, loc) => {
  if (!acc[loc.province]) {
    acc[loc.province] = [];
  }
  acc[loc.province].push(loc);
  return acc;
}, {} as Record<string, LocationData[]>);
