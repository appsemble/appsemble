/**
 * Convert a CSP key / values pair object into a real content security policy string.
 *
 * Any falsy values will be excluded.
 *
 * @param {Object<string, string[]>} csp The CSP object to convert
 * @returns {string} The CSP object as a string
 */
export default function makeCSP(csp) {
  return Object.entries(csp)
    .map(([key, values]) => [key, values.filter(Boolean)])
    .filter(([, values]) => values && values.length)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([key, values]) =>
        `${key} ${Array.from(new Set(values))
          .sort()
          .join(' ')}`,
    )
    .join('; ');
}
