/**
 * Get an app URL for a given organization ID, app path, and domain name.
 *
 * @param organizationId The organization in which the app is to generate a URL for.
 * @param path The path of the app for which to generate a URL.
 * @param domain If specified, this value is used instead of the app path, organization ID, and
 *   Studio URL
 * @returns A URL on which the app is hosted.
 */
export default function getAppUrl(organizationId: string, path: string, domain?: string): string {
  const { host, port, protocol } = window.location;
  const portPostfix =
    port && ((protocol === 'https:' && port !== '443') || (protocol === 'http:' && port !== '80'))
      ? `:${port}`
      : '';
  const origin = domain || `${path}.${organizationId}.${host}`;
  return `${protocol}//${origin}${portPostfix}`;
}
