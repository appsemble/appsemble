import { partialNormalized } from '@appsemble/utils';

import { cacheFirst, requestFirst } from './utils.js';

/**
 * Map all requests to a caching behavior based on the HTTP method and URL.
 *
 * @param event The request map.
 */
export function onFetch(event: FetchEvent): void {
  const { request } = event;

  // Pass through any non GET or HEAD requests.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return;
  }

  const { origin, pathname } = new URL(request.url);

  // App assets are immutable and can be cached.
  if (/^\/api\/apps\/\d+\/assets\//.test(pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // This is an unhandled request to an external service or the Appsemble API. This should not be
  // cached.
  if (origin !== globalThis.location.origin) {
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
  if (/^\/api\/blocks\/@(?:[\da-z-]+\/){2}versions\//.test(pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Cache app messages
  if (/^\/api\/apps\/\d+\/messages/.test(pathname)) {
    event.respondWith(requestFirst(request));
    return;
  }

  // Cache bulma and fa styles
  if (/\/(bulma\.min|fa.*all\.min)\.css$/.test(pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Cache block styles
  if (/^\/@appsemble\/[^/?]+\.css/.test(pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Cache shared styles
  if (/^\/shared.css/.test(pathname)) {
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
