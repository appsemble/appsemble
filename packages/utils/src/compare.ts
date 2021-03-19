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

/**
 * Default comparison function for dates.
 *
 * @param a - The first date to compare.
 * @param b - The second date to compare.
 * @returns Number representing whether `a` is less than, equal, or great compared to `b`.
 */
export function compareDates(a: Date, b: Date): number {
  return a.getTime() - b.getTime();
}
