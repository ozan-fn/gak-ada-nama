import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Navigation, AlertTriangle, Tag } from "lucide-react";
import { useLocationSearch } from "#/hooks/use-location-search";
import type { IndonesiaLocation } from "#/data/indonesia-locations";

type SearchType = "all" | "location" | "address" | "incident" | "category";

type LocationSearchBarProps = {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    city: string;
  }) => void;
};

// ponytail: real data dari backend later
const mockSearchResults = {
  address: [], // Empty for now
  incident: [], // Empty for now
  category: [], // Empty for now
};

const searchTabs: { type: SearchType; label: string; icon: typeof MapPin }[] = [
  { type: "all", label: "Semua", icon: Search },
  { type: "location", label: "Lokasi", icon: MapPin },
  { type: "address", label: "Alamat", icon: Navigation },
  { type: "incident", label: "Insiden", icon: AlertTriangle },
  { type: "category", label: "Kategori", icon: Tag },
];

export default function LocationSearchBar({
  onLocationSelect,
}: LocationSearchBarProps) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchType>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const locationResults = useLocationSearch(query);

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

  const handleSelectLocation = (location: IndonesiaLocation) => {
    setQuery(location.name);
    setShowDropdown(false);

    onLocationSelect({
      latitude: location.coordinates[1],
      longitude: location.coordinates[0],
      city: `${location.name}, ${location.province}`,
    });

    inputRef.current?.blur();
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowDropdown(value.trim().length >= 2);
  };

  // Filter results based on active tab
  const getFilteredResults = () => {
    if (query.trim().length < 2) return { locations: [], hasResults: false };

    switch (activeTab) {
      case "all":
        return {
          locations: locationResults,
          addresses: mockSearchResults.address,
          incidents: mockSearchResults.incident,
          categories: mockSearchResults.category,
          hasResults: locationResults.length > 0,
        };
      case "location":
        return {
          locations: locationResults,
          hasResults: locationResults.length > 0,
        };
      case "address":
        return {
          addresses: mockSearchResults.address,
          hasResults: false, // ponytail: will be true when backend ready
        };
      case "incident":
        return {
          incidents: mockSearchResults.incident,
          hasResults: false,
        };
      case "category":
        return {
          categories: mockSearchResults.category,
          hasResults: false,
        };
      default:
        return { hasResults: false };
    }
  };

  const filteredResults = getFilteredResults();

  return (
    <div className="relative w-full max-w-sm" ref={dropdownRef}>
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setShowDropdown(true)}
        placeholder="Cari lokasi, alamat, atau insiden..."
        className="h-9 w-full rounded-full border border-neutral-200 bg-neutral-50/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:border-transparent dark:bg-neutral-900/50 dark:border-neutral-800 dark:focus-visible:ring-neutral-700"
      />

      {/* Search Dropdown */}
      {showDropdown && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800 z-50 max-h-96 flex flex-col">
          {/* Search Type Tabs */}
          <div className="flex items-center gap-1 border-b border-neutral-100 dark:border-neutral-700 p-2">
            {searchTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.type;

              return (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => setActiveTab(tab.type)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto max-h-64">
            {filteredResults.hasResults ? (
              <div>
                {/* Location Results */}
                {filteredResults.locations &&
                  filteredResults.locations.length > 0 && (
                    <div>
                      {activeTab === "all" && (
                        <div className="px-3 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                          Lokasi
                        </div>
                      )}
                      {filteredResults.locations.map((location) => (
                        <button
                          key={`${location.name}-${location.province}`}
                          type="button"
                          onClick={() => handleSelectLocation(location)}
                          className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                              {location.name}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                              {location.province}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                {/* ponytail: Address, Incident, Category results will go here when backend ready */}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <Search className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mb-2" />
                <p className="text-sm text-neutral-900 dark:text-neutral-100 font-medium">
                  {activeTab === "location"
                    ? `Tidak ada lokasi ditemukan untuk "${query}"`
                    : activeTab === "all"
                      ? `Tidak ada hasil untuk "${query}"`
                      : `Fitur ${searchTabs.find((t) => t.type === activeTab)?.label} akan segera tersedia`}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {activeTab !== "location" && activeTab !== "all"
                    ? "Data akan dimuat dari backend"
                    : "Coba kata kunci lain"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
