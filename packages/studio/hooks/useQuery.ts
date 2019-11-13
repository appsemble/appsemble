import { useLocation } from 'react-router-dom';

/**
 * Get the query parameters of the current location.
 *
 * @returns The query parameters of the current location.
 */
export default function useQuery(): URLSearchParams {
  return new URLSearchParams(useLocation().search);
}
