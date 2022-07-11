const collator = new Intl.Collator('en', { numeric: true });

/**
 * Default comparison function for strings.
 *
 * @param a The first string to compare.
 * @param b The second string to compare.
 * @returns Number representing whether `a` is less than, equal, or great compared to `b`.
 */
export const compareStrings = collator.compare;
