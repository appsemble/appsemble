import { useEffect, useMemo } from 'preact/hooks';

/**
 * Use a memoized object URL.
 *
 * The Object URL is cleaned up automatically.
 *
 * @param obj - The object to represent as a URL.
 * @returns If the input is a Blob, an object URL to represent the blob. Otherwise the raw input.
 */
export function useObjectURL(obj: Blob | string): string {
  const url = useMemo(() => (obj instanceof Blob ? URL.createObjectURL(obj) : obj), [obj]);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return url;
}
