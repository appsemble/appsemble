import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Get the query parameters of the current location.
 *
 * @returns The query parameters of the current location.
 */
export function useQuery(): URLSearchParams {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}
