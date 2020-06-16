import * as React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Get a string representing the current location.
 *
 * This is primarily used to build URLs for redirection purposes.
 *
 * @returns The string representing the current location.
 */
export default function useLocationString(): string {
  const { hash, pathname, search } = useLocation();
  return React.useMemo(() => `${pathname}${search}${hash}`, [hash, pathname, search]);
}
