/**
 * Determine Indonesian timezone based on coordinates
 * Indonesia has 3 timezones: WIB (UTC+7), WITA (UTC+8), WIT (UTC+9)
 */

export type IndonesianTimezone = {
  zone: "Asia/Jakarta" | "Asia/Makassar" | "Asia/Jayapura";
  label: "WIB" | "WITA" | "WIT";
  utcOffset: 7 | 8 | 9;
};

export function getIndonesianTimezone(
  longitude?: number | null
): IndonesianTimezone {
  // If no longitude provided, default to WIB (Jakarta)
  if (longitude === undefined || longitude === null) {
    return {
      zone: "Asia/Jakarta",
      label: "WIB",
      utcOffset: 7,
    };
  }

  // Rough boundaries for Indonesian timezones based on longitude:
  // WIB (UTC+7):  < 120°E - Java, Sumatra, West/Central Kalimantan
  // WITA (UTC+8): 120°E - 130°E - Bali, Nusa Tenggara, South/East Kalimantan, Sulawesi
  // WIT (UTC+9):  > 130°E - Maluku, Papua

  if (longitude < 120) {
    // Western Indonesia Time
    return {
      zone: "Asia/Jakarta",
      label: "WIB",
      utcOffset: 7,
    };
  } else if (longitude < 130) {
    // Central Indonesia Time
    return {
      zone: "Asia/Makassar",
      label: "WITA",
      utcOffset: 8,
    };
  } else {
    // Eastern Indonesia Time
    return {
      zone: "Asia/Jayapura",
      label: "WIT",
      utcOffset: 9,
    };
  }
}
