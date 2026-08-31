import { useEffect, useRef, useState } from "react";
import { LocateFixed, LoaderCircle, MapPin, Search } from "lucide-react";

import { useLocationSearch } from "#/hooks/use-location-search";
import type { IndonesiaLocation } from "#/data/indonesia-locations";
import { useEcoLensLocationContextSafe } from "#/contexts/EcoLensLocationContext";
import { useEcoLensLocation } from "./useEcoLensLocation";

type EcoLensLocationSearchProps = {
  variant?: "default" | "compact";
  disabled?: boolean;
};

export default function EcoLensLocationSearch({
  variant = "default",
  disabled = false,
}: EcoLensLocationSearchProps) {
  const context = useEcoLensLocationContextSafe();
  const gps = useEcoLensLocation();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const location = context?.location ?? "";
  const setLocation = context?.setLocation ?? (() => {});
  const setCoordinates = context?.setCoordinates ?? (() => {});
  const coordinates = context?.coordinates ?? null;

  const locationResults = useLocationSearch(location);

  const hasQuery = location.trim().length >= 2;
  const isSearching = gps.status === "requesting";
  const isCompact = variant === "compact";

  useEffect(() => {
    if (!context || !gps.suggestedLocation || location.trim()) return;

    setLocation(gps.suggestedLocation);
  }, [context, gps.suggestedLocation, location, setLocation]);

  useEffect(() => {
    if (!context || !gps.coordinates || coordinates) return;

    setCoordinates(gps.coordinates);
  }, [context, gps.coordinates, coordinates, setCoordinates]);

  useEffect(() => {
    if (!showDropdown || disabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown, disabled]);

  // Provider not mounted, render nothing (after all hooks)
  if (!context) {
    return null;
  }

  const handleSelectLocation = (loc: IndonesiaLocation) => {
    setLocation(loc.name);

    setCoordinates({
      latitude: loc.coordinates[1],
      longitude: loc.coordinates[0],
    });

    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (value: string) => {
    setLocation(value);
    setShowDropdown(value.trim().length >= 2);
  };

  const handleFocus = () => {
    if (hasQuery) {
      setShowDropdown(true);
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Search */}
      <div className="flex items-center gap-1">
        <div className="relative min-w-0 flex-1">
          <Search
            className="
              pointer-events-none
              absolute left-3 top-1/2
              z-10 size-3.5
              -translate-y-1/2
              text-muted-foreground
            "
          />

          <input
            ref={inputRef}
            type="text"
            value={location}
            onChange={(event) => handleInputChange(event.target.value)}
            onFocus={handleFocus}
            disabled={disabled}
            placeholder="Cari lokasi..."
            aria-label="Cari lokasi"
            aria-expanded={!disabled && showDropdown}
            aria-autocomplete="list"
            className={`
              h-9 w-full
              ${isCompact ? "rounded-lg" : "rounded-full"}
              border border-neutral-200
              ${isCompact ? "bg-neutral-50/80" : "bg-neutral-50/50"}
              pl-9 pr-3
              ${isCompact ? "text-xs" : "text-sm"}
              text-neutral-900
              placeholder:text-neutral-400
              outline-none
              transition
              ${
                isCompact
                  ? "focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  : "focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-neutral-300"
              }
              disabled:cursor-not-allowed
              disabled:bg-neutral-50
              disabled:text-neutral-400
              disabled:opacity-70
              dark:border-neutral-800
              dark:bg-neutral-900/50
              dark:text-neutral-100
              dark:placeholder:text-neutral-500
              dark:disabled:bg-neutral-900
              dark:disabled:text-neutral-600
            `}
          />
        </div>

        {/* GPS tetap aktif */}
        <button
          type="button"
          onClick={gps.requestLocation}
          disabled={isSearching}
          aria-label="Gunakan lokasi GPS saya"
          title="Gunakan lokasi GPS saya"
          className={`
            flex size-9 shrink-0
            items-center justify-center
            ${isCompact ? "rounded-lg" : "rounded-full"}
            border border-neutral-200
            bg-white
            text-sky-600
            shadow-xs
            transition-colors
            hover:border-sky-200
            hover:bg-sky-50
            focus:outline-none
            focus:ring-2
            focus:ring-sky-100
            disabled:cursor-not-allowed
            disabled:opacity-60
            dark:border-neutral-800
            dark:bg-neutral-900
            dark:text-sky-400
            dark:hover:border-sky-900
            dark:hover:bg-sky-950/40
            dark:focus:ring-sky-950
          `}
        >
          {isSearching ? (
            <LoaderCircle className="size-4 motion-safe:animate-spin" />
          ) : (
            <LocateFixed className="size-4" />
          )}
        </button>
      </div>

      {/* Dropdown hanya untuk penggunaan normal.
          Ketika berada di drawer / disabled, bagian ini tidak muncul. */}
      {!disabled && showDropdown && hasQuery && (
        <div
          className="
            absolute
            inset-x-0
            top-full
            z-50
            mt-2
            overflow-hidden
            rounded-lg
            border border-neutral-200
            bg-white
            shadow-lg
            dark:border-neutral-700
            dark:bg-neutral-800
          "
        >
          {/* Header */}
          <div
            className="
              border-b
              border-neutral-100
              px-3 py-2
              dark:border-neutral-700
            "
          >
            <p
              className="
                text-xs
                font-semibold
                text-neutral-500
                dark:text-neutral-400
              "
            >
              Lokasi
            </p>
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto">
            {locationResults.length > 0 ? (
              locationResults.map((loc) => (
                <button
                  key={`${loc.name}-${loc.province}`}
                  type="button"
                  onClick={() => handleSelectLocation(loc)}
                  className="
                    flex w-full
                    items-start gap-2
                    border-b border-neutral-100
                    px-3 py-2.5
                    text-left text-sm
                    transition-colors
                    last:border-b-0
                    hover:bg-neutral-50
                    focus:bg-neutral-50
                    focus:outline-none
                    dark:border-neutral-700
                    dark:hover:bg-neutral-700
                    dark:focus:bg-neutral-700
                  "
                >
                  <MapPin
                    className="
                      mt-0.5
                      size-4
                      shrink-0
                      text-sky-500
                    "
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className="
                        truncate
                        font-medium
                        text-neutral-900
                        dark:text-neutral-100
                      "
                    >
                      {loc.name}
                    </p>

                    <p
                      className="
                        truncate
                        text-xs
                        text-neutral-500
                        dark:text-neutral-400
                      "
                    >
                      {loc.province}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div
                className="
                  flex flex-col
                  items-center justify-center
                  px-4 py-8
                "
              >
                <MapPin
                  className="
                    mb-2
                    size-10
                    text-neutral-300
                    dark:text-neutral-600
                  "
                />

                <p
                  className="
                    text-sm
                    font-medium
                    text-neutral-900
                    dark:text-neutral-100
                  "
                >
                  Tidak ada lokasi ditemukan
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-neutral-500
                    dark:text-neutral-400
                  "
                >
                  Coba kata kunci lain
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
