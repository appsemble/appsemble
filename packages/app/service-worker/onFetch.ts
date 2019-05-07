import { Awaitable, cacheFirst, requestFirst } from './utils';

/**
 * Map all requests to a caching behaviour based on the HTTP method and URL.
 *
 * @param request The request map.
 * @returns The matching HTTP response.
 */
export function respond(request: Request): Awaitable<Response> {
  // Pass through any non GET requests.
  if (request.method !== 'GET') {
    return fetch(request);
  }
  const { origin, pathname } = new URL(request.url);
  // This is a request to an external service This should not be cached.
  if (origin !== self.location.origin) {
    return fetch(request);
  }
  // This is a request made by webpack dev server.
  if (process.env.NODE_ENV !== 'production' && pathname.endsWith('.hot-update.json')) {
    return fetch(request);
  }
  // These are requests that fetch an app definition. The latest app definition is preferred, but it
  // is acceptable to fallback to the cache, so the app works offline.
  if (/^\/api\/apps\/\d+$/.test(pathname)) {
    return requestFirst(request);
  }
  // Other requests made to the Appsemble API should not be cached.
  if (pathname.startsWith('/api/')) {
    return fetch(request);
  }
  // It’s ok to cache the API explorer.
  if (pathname.startsWith('/api-explorer')) {
    return requestFirst(request);
  }
  // This is a generated app file. It should be attempted to use the most recent version, but it is
  // acceptable to fallback to the cache, so the app works offline. E.g. '/1/manifest.json',
  // '/1/icon.png'.
  if (/^\/\d+\//.test(pathname)) {
    return requestFirst(request);
  }
  // This is a static file. Let’s cache it.
  if (pathname.includes('.')) {
    return cacheFirst(request);
  }
  // If the URL either consists of a normalized path, it should be remapped to the cached url which
  // consists of the client URL path. E.g. '/my-app', '/my-app/home'.
  const match = pathname.match(/^(\/[a-z\d-]+)(\/[a-z\d/-]+)*$/);
  if (match) {
    // eslint-disable-next-line compat/compat
    return requestFirst(new Request(`${origin}${match[1]}`));
  }
  // This is unhandled. Let’s just use the default browser behaviour to be safe.
  return fetch(request);
}

export default function onFetch(event: FetchEvent): void {
  event.respondWith(respond(event.request));
}
