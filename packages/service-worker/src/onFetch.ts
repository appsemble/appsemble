import { partialNormalized } from '@appsemble/utils';

import { cacheFirst, requestFirst } from './utils';

/**
 * Map all requests to a caching behaviour based on the HTTP method and URL.
 *
 * @param request The request map.
 * @returns The matching HTTP response.
 */
export default function onFetch(event: FetchEvent): void {
  const { request } = event;

  // Pass through any non GET requests.
  if (request.method !== 'GET') {
    return;
  }
  const { origin, pathname } = new URL(request.url);

  // This is a request to an external service or the Appsemble API. This should not be cached.
  if (origin !== self.location.origin) {
    return;
  }

  // Caching range requests cause issues in Safari. Also, range requests shouldn’t be made to this
  // origin anyway.
  if (request.headers.has('range')) {
    return;
  }

  // This is a request made by webpack dev server.
  if (process.env.NODE_ENV !== 'production' && pathname.endsWith('.hot-update.json')) {
    return;
  }

  // Block version requests are immutable and should be cached.
  if (/^\/api\/blocks\/@[0-9a-z-]+\/[0-9a-z-]+\/versions\//.test(pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Static app files are immutable, because they are hashed, and should be cached.
  if (/^\/_\/.+/.test(pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // This is a generated app file. It should be attempted to use the most recent version, but it is
  // acceptable to fallback to the cache, so the app works offline. E.g. '/manifest.json',
  // '/icon.png', '/core.css'.
  if (pathname.includes('.')) {
    event.respondWith(requestFirst(request));
    return;
  }

  // If the URL either consists of a normalized path, it should be remapped to the cached url which
  // consists of the client URL path. E.g. '/', '/home', '/my-page''
  const match = pathname.match(`^/${partialNormalized.source}?`);
  if (match) {
    event.respondWith(requestFirst(new Request(`${origin}${match[0]}`)));
  }

  // This is unhandled. Let’s just use the default browser behaviour to be safe.
}
