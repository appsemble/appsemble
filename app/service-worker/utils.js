async function put(request, response, fallback) {
  // Only cache responses if the status code is 2xx.
  if (response.ok) {
    const cache = await caches.open('appsemble');
    cache.put(request, response.clone());
    return response;
  }
  return fallback();
}

async function tryCached(request, fallback) {
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
 * @param {Request} request The request for which to get a response.
 * @returns {Response} The fetch response object.
 */
export async function cacheFirst(request) {
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
 * @param {Request} request The request for which to get a response.
 * @returns {Response} The fetch response object.
 */
export async function requestFirst(request) {
  let response;
  try {
    response = await fetch(request);
  } catch (error) {
    // This might happen if the API could not be reached.
    return tryCached(request, () => {
      throw error;
    });
  }
  return put(request, response, () => tryCached(request, () => response));
}
