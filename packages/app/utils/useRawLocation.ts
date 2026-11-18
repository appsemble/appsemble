import { navigate, useLocationProperty } from 'wouter-preact/use-browser-location';

/**
 * Get the browser location for the router, with the path as the browser encodes it.
 *
 * The router decodes the path with `decodeURI` before it matches routes. Escaping `%` makes that
 * decoding yield the encoded path, so route parameters keep their escape sequences until
 * `useRouteParams` decodes them once.
 *
 * @returns The escaped path and the function to navigate.
 */
export function useRawLocation(): [string, typeof navigate] {
  return [useLocationProperty(() => window.location.pathname.replaceAll('%', '%25')), navigate];
}
