import { useState, useEffect } from 'react';
import { getDynamicBaseline, type DynamicBaseline } from '#/lib/historicalBaseline';

/**
 * React hook to fetch dynamic baseline from real APIs
 * - Temperature, Humidity, Rain: Open-Meteo Historical Weather API (1-year average)
 * - AQI: AQICN nearby stations median (local area baseline)
 * 
 * Cached for 7 days in localStorage
 */
export function useDynamicBaseline(
  latitude: number | null,
  longitude: number | null,
  city: string | null
) {
  const [baseline, setBaseline] = useState<DynamicBaseline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if location not available
    if (!latitude || !longitude || !city) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchBaseline() {
      try {
        setLoading(true);
        setError(null);

        const result = await getDynamicBaseline(latitude!, longitude!, city!);

        if (!cancelled) {
          setBaseline(result);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch baseline'));
          setLoading(false);
        }
      }
    }

    fetchBaseline();

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, city]);

  return { baseline, loading, error };
}
