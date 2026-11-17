import { useMemo } from 'react';
import { useParams } from 'wouter-preact';

/**
 * Get the named parameters of the matched routes.
 *
 * The router also exposes every capture by its position, which isn't part of the page parameters.
 * The values are decoded here, because `useRawLocation` gives the router the encoded path.
 *
 * @returns The named route parameters.
 */
export function useRouteParams(): Readonly<Record<string, string | undefined>> {
  const params = useParams();
  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(params)
          .filter(([key]) => !/^\d+$/.test(key))
          .map(([key, value]) => [key, value && decodeURIComponent(value)]),
      ),
    [params],
  );
}
