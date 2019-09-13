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

  // This is a request to an external service This should not be cached.
  if (origin !== self.location.origin) {
    return;
  }

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

  // This is an organization style sheet. It may have been updated, so request a new one if
  // available.
  if (/^\/api\/organizations\/[0-9a-z-]+\/style\//.test(pathname)) {
    event.respondWith(requestFirst(request));
    return;
  }

  // This is an app specific style sheet. It may have been updated, so request a new one if
  // available.
  if (/^\/api\/apps\/\d+\/style\//.test(pathname)) {
    event.respondWith(requestFirst(request));
    return;
  }

  // Other requests made to the Appsemble API should not be cached.
  if (pathname.startsWith('/api/')) {
    return;
  }

  // Requests made to the API explorer should not be cached.
  if (pathname.startsWith('/api-explorer')) {
    return;
  }

  // This is a generated app file. It should be attempted to use the most recent version, but it is
  // acceptable to fallback to the cache, so the app works offline. E.g. '/1/manifest.json',
  // '/1/icon.png'.
  if (/^\/\d+\//.test(pathname)) {
    event.respondWith(requestFirst(request));
    return;
  }

  // This is a static file. Let’s cache it.
  if (pathname.includes('.')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // If the URL either consists of a normalized path, it should be remapped to the cached url which
  // consists of the client URL path. E.g. '@my-org/my-app', '@my-org/my-app/home'.
  const match = pathname.match(/^(\/@[0-9a-z-]+\/[0-9a-z-]+)(\/|$)/);
  if (match) {
    // eslint-disable-next-line compat/compat
    event.respondWith(requestFirst(new Request(`${origin}${match[1]}`)));
  }

  // This is unhandled. Let’s just use the default browser behaviour to be safe.
}
