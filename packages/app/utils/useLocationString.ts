import { useLocationProperty } from 'wouter-preact/use-browser-location';

/**
 * Get a string representing the current location.
 *
 * This is primarily used to build URLs for redirection purposes.
 *
 * @returns The string representing the current location.
 */
export function useLocationString(): string {
  return useLocationProperty(
    () => `${window.location.pathname}${window.location.search}${window.location.hash}`,
  );
}
