/**
 * Get exactly one query search parameter.
 *
 * @param qs - The URL search params from which to get the value.
 * @param name - The name of which to get the value.
 * @returns The value of the seatch params, but only if exactly one value matches. Otherwise, `null`
 * is returned.
 */
export function getOneSearchParam(qs: URLSearchParams, name: string): string | null {
  const values = qs.getAll(name);
  if (values.length === 1) {
    return values[0];
  }
  return null;
}
