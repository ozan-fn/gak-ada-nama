import { useState, useRef, useEffect } from "react";
import { Wind, MapPin } from "lucide-react";
import { useUserLocation } from "#/hooks/useUserLocation";
import { useEnvironmentData } from "#/hooks/useEnvironmentData";
import { getAQIColor, getAQICategory, getAQIAdvice } from "#/lib/aqiUtils";

export default function AQIIndicator() {
  const userLocation = useUserLocation();
  const { aqi, loading: aqiLoading } = useEnvironmentData(userLocation);

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  const currentAQI = aqi?.aqi ?? 0;
  const aqiColor = getAQIColor(currentAQI);
  const aqiCategory = getAQICategory(currentAQI);
  const aqiAdvice = getAQIAdvice(currentAQI);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100/60 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900 transition-colors dark:bg-neutral-800/60 dark:text-neutral-400 dark:hover:bg-neutral-700/80 dark:hover:text-neutral-100"
        aria-label="Air Quality Index"
      >
        <Wind className="h-4 w-4" />
        {!aqiLoading && currentAQI > 0 && (
          <span
            className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${aqiColor} ring-2 ring-white dark:ring-neutral-900`}
            aria-hidden="true"
          />
        )}
      </button>

      {/* AQI Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800 z-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Kualitas Udara
              </p>
              <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {currentAQI > 0 ? currentAQI : "—"}
                <span className="ml-1 text-sm font-medium text-neutral-500">
                  AQI
                </span>
              </p>
            </div>
            <span
              className={`mt-1 inline-flex items-center rounded-full ${aqiColor} px-2 py-1 text-xs font-medium text-white`}
            >
              {aqiCategory}
            </span>
          </div>

          <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3 dark:border-neutral-700">
            <p className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-500 dark:text-neutral-400" />
              <span>{userLocation?.city || "Lokasi Anda"}</span>
            </p>
            {currentAQI > 0 ? (
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {aqiAdvice}
              </p>
            ) : (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Data AQI tidak tersedia untuk lokasi ini.
              </p>
            )}
          </div>

          <div className="mt-3 border-t border-neutral-100 pt-2 dark:border-neutral-700">
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
              Data real-time dari AQICN
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
