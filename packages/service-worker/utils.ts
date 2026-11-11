import { type Promisable } from 'type-fest';

const cacheWrites = new Set<Promise<unknown>>();

async function put(
  request: Request,
  response: Response,
  fallback: () => Promisable<Response>,
): Promise<Response> {
  if (response.status === 401 || response.status === 403) {
    return response;
  }
  // Cache successful responses and opaque image responses.
  if (response.ok || (response.type === 'opaque' && request.destination === 'image')) {
    const cache = await caches.open('appsemble');
    // The response streams to the page while it is stored. A failed write, for example when the
    // storage quota is exceeded, keeps the response usable.
    const write = cache.put(request, response.clone()).catch((): null => null);
    cacheWrites.add(write);
    write.finally(() => cacheWrites.delete(write));
    return response;
  }
  return fallback();
}

/**
 * Wait until the cache writes that have started are finished.
 */
export async function finishCacheWrites(): Promise<void> {
  await Promise.all(cacheWrites);
}

export async function tryCached(
  request: Request,
  fallback: () => Promisable<Response>,
): Promise<Response> {
  if (request.method === 'HEAD') {
    const cached = await caches.match(new Request(request.url, { method: 'GET' }));
    if (cached) {
      return new Response(null, {
        status: cached.status || 200,
        headers: new Headers(cached.headers),
      });
    }
    return fallback();
  }

  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  return fallback();
}

/**
 * Try returning a response from the cache first.
 *
 * If no response could be found in the cache, the resource is requested anyway and cached.
 *
 * @param request The request for which to get a response.
 * @returns The fetch response object.
 */
export function cacheFirst(request: Request): Promise<Response> {
  return tryCached(request, async () => {
    const response = await fetch(request);
    return put(request, response, () => response);
  });
}

/**
 * Try returning a response from a request first.
 *
 * If the request fails for whatever reason, a cached response is returned.
 *
 * @param request The request for which to get a response.
 * @param cacheRequest The request used to identify the cached response.
 * @returns The fetch response object.
 */
export async function requestFirst(
  request: Request,
  cacheRequest: Request = request,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(request);
  } catch (error: unknown) {
    // This might happen if the API could not be reached.
    return tryCached(cacheRequest, () => {
      throw error;
    });
  }
  return put(cacheRequest, response, () => tryCached(cacheRequest, () => response));
}

/**
 * Serve a cached response only if it is marked immutable, and request a fresh one otherwise.
 *
 * App asset URLs carry either an asset id or an asset name in their last segment. An id addresses
 * one fixed set of bytes, while a name can be pointed at a different asset at any time. Only the
 * server can tell the two apart, and it records that verdict in `Cache-Control`, so read the
 * verdict back off the stored response instead of deriving it from the URL.
 *
 * A stored response that may be replaced is still served when the network fails or takes longer
 * than 3 seconds to respond, so a stalled connection does not hold up an asset that is available.
 *
 * @param request The request for which to get a response.
 * @returns The fetch response object.
 */
export async function cacheFirstIfImmutable(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached?.headers.get('Cache-Control')?.includes('immutable')) {
    return cached;
  }
  let response: Response;
  try {
    const fetching = fetch(request);
    response = await (cached
      ? Promise.race([
          fetching,
          new Promise<never>((resolve, reject) => {
            setTimeout(() => reject(new Error('The network did not respond in time')), 3000);
          }),
        ])
      : fetching);
  } catch (error: unknown) {
    return tryCached(request, () => {
      throw error;
    });
  }

  if (response.status === 404) {
    const cache = await caches.open('appsemble');
    const { origin, pathname } = new URL(request.url);
    const cacheKeys = await cache.keys();
    for (const cacheRequest of cacheKeys) {
      const cachedUrl = new URL(cacheRequest.url);
      if (cachedUrl.origin === origin && cachedUrl.pathname === pathname) {
        await cache.delete(cacheRequest);
      }
    }
    return response;
  }

  return put(request, response, () => tryCached(request, () => response));
}

/**
 * Serve an app asset, matching SVG images independently of raster resize parameters.
 *
 * @param request The asset request.
 * @returns The requested asset response.
 */
export async function assetFirst(request: Request): Promise<Response> {
  try {
    return await cacheFirstIfImmutable(request);
  } catch (error) {
    const original = new URL(request.url);
    if (!original.searchParams.has('width') && !original.searchParams.has('height')) {
      throw error;
    }
    original.searchParams.delete('width');
    original.searchParams.delete('height');
    const cached = await caches.match(new Request(original));
    if (cached?.headers.get('content-type')?.split(';', 1)[0].trim() === 'image/svg+xml') {
      return cached;
    }
    throw error;
  }
}

/**
 * Implements a stale-while-revalidate caching strategy.
 *
 * 1. Serve cached response immediately if available.
 * 2. Fetch new data in the background and update the cache.
 * 3. Ensure the user gets the fastest response while keeping data fresh.
 *
 * @param request The request for which to get a response.
 * @returns The fetch response object.
 */
export async function staleWhileRevalidate(request: Request): Promise<Response> {
  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  const cachedResponse = await tryCached(request, () => null);

  // Fetch fresh data in the background and update cache.
  const fetchPromise = fetch(request)
    .then((response) => put(request, response, () => response))
    // Ignore errors, use cached response instead
    .catch((): null => null);

  return cachedResponse || fetchPromise || fetch(request);
}

/**
 * Handles modifying requests (POST, PUT, PATCH, DELETE) by invalidating the cache
 * for all related resources. This ensures that after a resource is modified,
 * the next fetch request retrieves fresh data.
 *
 * Steps:
 * 1. Performs the actual API request.
 * 2. If the request is successful, deletes all cached responses that match the resource type.
 * 3. Ensures that future GET requests to this resource type will fetch fresh data.
 *
 * @param request The modifying request (POST, PUT, PATCH, DELETE) that affects resources.
 * @returns A promise that resolves with the original fetch response.
 */
export async function handleModifyAndInvalidateCache(request: Request): Promise<Response> {
  const clonedRequest = request.clone();
  const response = await fetch(request);

  if (!response.ok) {
    return response;
  }

  const cache = await caches.open('appsemble');
  const resourceUrl = new URL(clonedRequest.url);

  const resourceListPrefix = resourceUrl.pathname.replace(/\/[^/]+$/, '');
  const positionListPrefix = resourceUrl.pathname.replace(
    /(\/api\/apps\/\d+\/resources\/[^/]+).*/,
    '$1',
  );

  const cacheKeys = await cache.keys();
  for (const cacheRequest of cacheKeys) {
    if (
      cacheRequest.url.startsWith(resourceUrl.origin + resourceListPrefix) ||
      cacheRequest.url.startsWith(resourceUrl.origin + positionListPrefix)
    ) {
      await cache.delete(cacheRequest);
    }
  }

  return response;
}
