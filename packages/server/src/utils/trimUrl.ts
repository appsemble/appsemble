import { URL } from 'url';

/**
 * Trim a URL by stripping off all query parameters, the hash, and the port if necessary.
 *
 * @param url The URL to trim.
 */
export default function trimUrl(url: string): string {
  try {
    const { origin, pathname } = new URL(url);
    return `${origin}${pathname}`;
  } catch (err) {
    return null;
  }
}
