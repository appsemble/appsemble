/**
 * Default comparison function for strings.
 *
 * @param a - The first string to compare.
 * @param b - The second string to compare.
 * @returns Number representing whether `a` is less than, equal, or great compared to `b`.
 */
export function compareStrings(a: string, b: string): number {
  return a.localeCompare(b);
}
