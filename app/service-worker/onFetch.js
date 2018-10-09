import { cacheFirst, requestFirst } from './utils';

/**
 * Map all requests to a caching behaviour based on the HTTP method and URL.
 *
 * @param {Request} request The request map.
 * @returns {Response} The matching HTTP response.
 */
export function respond(request) {
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
  // If the URL either consists of a digit, or a digit and an alphabetic child path, it should be
  // remapped to the cached url which consists of just a digit. E.g. '/1', '/1/home'.
  const match = pathname.match(/^(\/\d+)(\/[\w/-]+)*$/);
  if (match) {
    return requestFirst(new Request(`${origin}${match[1]}`));
  }
  // If a URL starts with a digit, it’s related to generated app files. It should be attempted to
  // use the most recent version, but it is acceptable to fallback to the cache, so the app works
  // offline. E.g. '/1/manifest.json', '/1/icon.png'.
  if (/^\/\d+\//.test(pathname)) {
    return requestFirst(request);
  }
  // These are requests that fetch an app definition. The latest app definition is preferred, but it
  // is acceptable to fallback to the cache, so the app works offline.
  if (/^\/api\/apps\/\d+$/.test(pathname)) {
    return requestFirst(request);
  }
  // Other requests made to the Appsemble API should not be cached.
  if (/^\/api\//.test(pathname)) {
    return fetch(request);
  }
  // This is a request which is made to the Appsemble server, but not to the API. This is probably a
  // static asset. Let’s cache it.
  return cacheFirst(request);
}

export default function onFetch(event) {
  event.respondWith(respond(event.request));
}
