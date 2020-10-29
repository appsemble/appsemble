import { useLocation } from 'react-router-dom';

/**
 * Get a string representing the current location.
 *
 * This is primarily used to build URLs for redirection purposes.
 *
 * @returns The string representing the current location.
 */
export function useLocationString(): string {
  const location = useLocation();

  return `${location.pathname}${location.search}${location.hash}`;
}
