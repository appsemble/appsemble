export type ContentSecurityPolicy = Record<string, (false | string)[]>;

/**
 * Convert a CSP key / values pair object into a real content security policy string.
 *
 * Any falsy values will be excluded.
 *
 * @param csp - The CSP object to convert
 * @returns The CSP object as a string
 */
export function makeCSP(csp: ContentSecurityPolicy): string {
  return Object.entries(csp)
    .map(([key, values]) => [key, values.filter(Boolean)] as const)
    .filter(([, values]) => values?.length)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => `${key} ${[...new Set(values)].sort().join(' ')}`)
    .join('; ');
}
