import { useMemo } from 'react';
import { useParams } from 'wouter-preact';

/**
 * Get the named parameters of the matched routes.
 *
 * The router also exposes every capture by its position, which isn't part of the page parameters.
 * It decodes the path with `decodeURI`, which keeps the escape sequences of reserved characters, so
 * those are decoded here.
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
          .map(([key, value]) => [
            key,
            value?.replace(/%(?:2[346bcf]|3[abdf]|40)/gi, decodeURIComponent),
          ]),
      ),
    [params],
  );
}
