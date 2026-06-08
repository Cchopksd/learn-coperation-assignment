"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/api-client";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Runs an async loader on mount (and whenever `deps` change) and exposes
 * loading / error / data plus a manual `reload`. Used by every list/detail page
 * so loading and error states stay consistent.
 */
export function useApi<T>(
  loader: () => Promise<T>,
  deps: React.DependencyList = [],
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await loader();
        if (active) setData(result);
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Unexpected error.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, loading, error, reload };
}
