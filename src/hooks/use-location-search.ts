import { useState, useEffect, useMemo } from "react";
import { indonesiaLocations, type IndonesiaLocation } from "@/data/indonesia-locations";

export function useLocationSearch(query: string, delay = 300): IndonesiaLocation[] {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), delay);
    return () => clearTimeout(timer);
  }, [query, delay]);

  const results = useMemo(() => {
    const trimmed = debouncedQuery.trim().toLowerCase();
    if (trimmed.length < 2) return [];

    return indonesiaLocations
      .filter(
        (loc) =>
          loc.name.toLowerCase().includes(trimmed) ||
          loc.province.toLowerCase().includes(trimmed)
      )
      .slice(0, 5);
  }, [debouncedQuery]);

  return results;
}
