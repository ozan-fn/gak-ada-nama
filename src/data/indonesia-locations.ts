export interface IndonesiaLocation {
  name: string;
  province: string;
  coordinates: [number, number]; // [lng, lat]
}

export const indonesiaLocations: IndonesiaLocation[] = [
  // DKI Jakarta
  { name: "Jakarta Pusat", province: "DKI Jakarta", coordinates: [106.8456, -6.1751] },
  { name: "Jakarta Utara", province: "DKI Jakarta", coordinates: [106.8827, -6.1385] },
  { name: "Jakarta Barat", province: "DKI Jakarta", coordinates: [106.7942, -6.1668] },
  { name: "Jakarta Selatan", province: "DKI Jakarta", coordinates: [106.8294, -6.2615] },
  { name: "Jakarta Timur", province: "DKI Jakarta", coordinates: [106.9057, -6.2754] },
  
  // Jawa Barat
  { name: "Bandung", province: "Jawa Barat", coordinates: [107.6191, -6.9175] },
  { name: "Bogor", province: "Jawa Barat", coordinates: [106.7989, -6.5944] },
  { name: "Bekasi", province: "Jawa Barat", coordinates: [107.0007, -6.2349] },
  { name: "Depok", province: "Jawa Barat", coordinates: [106.8183, -6.4025] },
  { name: "Cirebon", province: "Jawa Barat", coordinates: [108.5571, -6.7063] },
  { name: "Sukabumi", province: "Jawa Barat", coordinates: [106.9269, -6.9278] },
  { name: "Tasikmalaya", province: "Jawa Barat", coordinates: [108.2204, -7.3272] },
  
  // Jawa Tengah
  { name: "Semarang", province: "Jawa Tengah", coordinates: [110.4203, -6.9932] },
  { name: "Solo", province: "Jawa Tengah", coordinates: [110.8209, -7.5755] },
  { name: "Yogyakarta", province: "DI Yogyakarta", coordinates: [110.3695, -7.7956] },
  { name: "Magelang", province: "Jawa Tengah", coordinates: [110.2175, -7.4797] },
  { name: "Purwokerto", province: "Jawa Tengah", coordinates: [109.2346, -7.4246] },
  { name: "Pekalongan", province: "Jawa Tengah", coordinates: [109.6754, -6.8886] },
  { name: "Tegal", province: "Jawa Tengah", coordinates: [109.1402, -6.8694] },
  
  // Jawa Timur
  { name: "Surabaya", province: "Jawa Timur", coordinates: [112.7521, -7.2575] },
  { name: "Malang", province: "Jawa Timur", coordinates: [112.6304, -7.9797] },
  { name: "Kediri", province: "Jawa Timur", coordinates: [112.0178, -7.8167] },
  { name: "Mojokerto", province: "Jawa Timur", coordinates: [112.4338, -7.4664] },
  { name: "Madiun", province: "Jawa Timur", coordinates: [111.5239, -7.6298] },
  { name: "Probolinggo", province: "Jawa Timur", coordinates: [113.2159, -7.7543] },
  { name: "Banyuwangi", province: "Jawa Timur", coordinates: [114.3691, -8.2195] },
  
  // Banten
  { name: "Tangerang", province: "Banten", coordinates: [106.6290, -6.1781] },
  { name: "Serang", province: "Banten", coordinates: [106.1503, -6.1204] },
  { name: "Cilegon", province: "Banten", coordinates: [106.0010, -6.0025] },
  { name: "Tangerang Selatan", province: "Banten", coordinates: [106.7424, -6.2886] },
  
  // Sumatera Utara
  { name: "Medan", province: "Sumatera Utara", coordinates: [98.6722, 3.5952] },
  { name: "Binjai", province: "Sumatera Utara", coordinates: [98.4854, 3.6001] },
  { name: "Pematangsiantar", province: "Sumatera Utara", coordinates: [99.0680, 2.9640] },
  
  // Sumatera Barat
  { name: "Padang", province: "Sumatera Barat", coordinates: [100.3543, -0.9471] },
  { name: "Bukittinggi", province: "Sumatera Barat", coordinates: [100.3691, -0.3055] },
  
  // Riau
  { name: "Pekanbaru", province: "Riau", coordinates: [101.4478, 0.5071] },
  
  // Kepulauan Riau
  { name: "Batam", province: "Kepulauan Riau", coordinates: [104.0305, 1.0456] },
  { name: "Tanjung Pinang", province: "Kepulauan Riau", coordinates: [104.4583, 0.9183] },
  
  // Sumatera Selatan
  { name: "Palembang", province: "Sumatera Selatan", coordinates: [104.7458, -2.9761] },
  
  // Lampung
  { name: "Bandar Lampung", province: "Lampung", coordinates: [105.2611, -5.4294] },
  
  // Kalimantan Barat
  { name: "Pontianak", province: "Kalimantan Barat", coordinates: [109.3425, -0.0263] },
  
  // Kalimantan Tengah
  { name: "Palangkaraya", province: "Kalimantan Tengah", coordinates: [113.9213, -2.2090] },
  
  // Kalimantan Selatan
  { name: "Banjarmasin", province: "Kalimantan Selatan", coordinates: [114.5907, -3.3194] },
  
  // Kalimantan Timur
  { name: "Balikpapan", province: "Kalimantan Timur", coordinates: [116.8289, -1.2379] },
  { name: "Samarinda", province: "Kalimantan Timur", coordinates: [117.1484, -0.5022] },
  
  // Sulawesi Utara
  { name: "Manado", province: "Sulawesi Utara", coordinates: [124.8413, 1.4748] },
  
  // Sulawesi Selatan
  { name: "Makassar", province: "Sulawesi Selatan", coordinates: [119.4327, -5.1477] },
  
  // Bali
  { name: "Denpasar", province: "Bali", coordinates: [115.2126, -8.6705] },
  
  // Nusa Tenggara Barat
  { name: "Mataram", province: "Nusa Tenggara Barat", coordinates: [116.1158, -8.5833] },
  
  // Nusa Tenggara Timur
  { name: "Kupang", province: "Nusa Tenggara Timur", coordinates: [123.6077, -10.1718] },
  
  // Papua
  { name: "Jayapura", province: "Papua", coordinates: [140.7184, -2.5920] },
  
  // Maluku
  { name: "Ambon", province: "Maluku", coordinates: [128.1819, -3.6954] },
];
