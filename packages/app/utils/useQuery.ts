import { useMemo } from 'preact/hooks';
import { useLocationProperty } from 'wouter-preact/use-browser-location';

/**
 * Get the query parameters of the current location.
 *
 * @returns The query parameters of the current location.
 */
export function useQuery(): URLSearchParams {
  const search = useLocationProperty(() => window.location.search);
  return useMemo(() => new URLSearchParams(search), [search]);
}
