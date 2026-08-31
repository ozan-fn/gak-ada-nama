import { MapPin, ChevronDown } from "lucide-react";
import { useState } from "react";
import { indonesiaLocations } from "@/data/indonesia-locations";

type InsightsFilterBarProps = {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  locationFilter: string;
  setLocationFilter: (location: string) => void;
};

export default function InsightsFilterBar({
  activeFilter,
  setActiveFilter,
  locationFilter,
  setLocationFilter,
}: InsightsFilterBarProps) {
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // ponytail: group by province
  const locationsByProvince = indonesiaLocations.reduce((acc, loc) => {
    if (!acc[loc.province]) acc[loc.province] = [];
    acc[loc.province].push(loc.name);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {["Semua", "Tinggi", "Sedang", "Rendah"].map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeFilter === filter
                ? "bg-sky-500 text-white shadow-sm shadow-sky-500/20"
                : "text-neutral-600 hover:bg-sky-50 hover:text-sky-600 dark:text-neutral-400 dark:hover:bg-sky-950 dark:hover:text-sky-400"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Location Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowLocationDropdown(!showLocationDropdown)}
          className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 sm:w-64"
        >
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5" />
            <span className="truncate">{locationFilter || "Semua Lokasi"}</span>
          </div>
          <ChevronDown className="size-3.5 shrink-0" />
        </button>

        {showLocationDropdown && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-10"
              onClick={() => setShowLocationDropdown(false)}
              aria-label="Close dropdown"
            />
            <div className="absolute right-0 top-full z-20 mt-1 max-h-96 w-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
              <button
                type="button"
                onClick={() => {
                  setLocationFilter("");
                  setShowLocationDropdown(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                  !locationFilter
                    ? "bg-sky-50 font-medium text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Semua Lokasi
              </button>
              {Object.entries(locationsByProvince).map(([province, cities]) => (
                <div key={province}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                    {province}
                  </div>
                  {cities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setLocationFilter(city);
                        setShowLocationDropdown(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                        locationFilter === city
                          ? "bg-sky-50 font-medium text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
                          : "text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
