import { type Promisable } from 'type-fest';

async function put(
  request: Request,
  response: Response,
  fallback: () => Promisable<Response>,
): Promise<Response> {
  // Only cache responses if the status code is 2xx
  // or if the status is 0 due to cors and the destination is an image
  if (response.ok || (response.status === 0 && request.destination === 'image')) {
    const cache = await caches.open('appsemble');
    cache.put(request, response.clone());
    return response;
  }
  return fallback();
}

async function tryCached(
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
 * @returns The fetch response object.
 */
export async function requestFirst(request: Request): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(request);
  } catch (error: unknown) {
    // This might happen if the API could not be reached.
    return tryCached(request, () => {
      throw error;
    });
  }
  return put(request, response, () => tryCached(request, () => response));
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

  const cacheKeys = await cache.keys();
  for (const cacheRequest of cacheKeys) {
    if (cacheRequest.url.startsWith(resourceUrl.origin + resourceListPrefix)) {
      await cache.delete(cacheRequest);
    }
  }

  return response;
}
