import { noop } from '@appsemble/utils';
import makeServiceWorkerEnv from 'service-worker-mock';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { onFetch } from './onFetch.js';

let online: boolean;
let networkResponse: Response;

async function browserFetch(request: Request): Promise<Response> {
  const response = await trigger('fetch', request);
  return response ?? fetch(request);
}

beforeEach(() => {
  const env = makeServiceWorkerEnv();
  Object.assign(global, env);
  // @ts-expect-error The mock environment uses the service worker fetch event.
  env.addEventListener('fetch', onFetch);
  online = true;
  vi.stubGlobal('fetch', () => {
    if (!online) {
      return Promise.reject(new TypeError('Network unavailable'));
    }
    return Promise.resolve(networkResponse.clone());
  });
});

afterEach(() => vi.unstubAllGlobals());

it.each([
  ['messages/en', { messages: { title: 'Routine' } }],
  ['variables', [{ name: 'deviceName', value: 'Nursery lamp' }]],
])('serves app %s offline when the API uses another origin', async (path, data) => {
  const request = new Request(`https://studio.example/api/apps/2/${path}`);
  networkResponse = new Response(JSON.stringify(data));
  expect(await (await browserFetch(request)).json()).toStrictEqual(data);

  online = false;
  expect(await (await browserFetch(request)).json()).toStrictEqual(data);
});

it.each([
  ['messages/en', { messages: { title: 'Routine' } }, { messages: { title: 'Updated routine' } }],
  [
    'variables',
    [{ name: 'deviceName', value: 'Nursery lamp' }],
    [{ name: 'deviceName', value: 'Bedroom lamp' }],
  ],
])(
  'serves cached app %s when the browser adds Origin, preserving other Vary headers',
  async (path, data, updatedData) => {
    const url = `https://studio.example/api/apps/2/${path}`;
    const cache = await caches.open('appsemble');
    await cache.put(
      new Request(url, { headers: { 'Accept-Language': 'en' } }),
      new Response(JSON.stringify(data), { headers: { Vary: 'Origin, Accept-Language' } }),
    );
    // Model Vary at the cache IO boundary; service-worker-mock matches URLs only.
    const match = cache.match.bind(cache);
    vi.spyOn(cache, 'match').mockImplementation(async (input, options = {}) => {
      const response = await match(input, options);
      if (!response || options.ignoreVary) {
        return response;
      }
      const request = new Request(input);
      const [cachedRequest] = await cache.keys(request, options);
      const vary = response.headers.get('Vary')?.split(',') ?? [];
      return !cachedRequest ||
        vary.some(
          (header) =>
            cachedRequest.headers.get(header.trim()) !== request.headers.get(header.trim()),
        )
        ? undefined
        : response;
    });
    vi.spyOn(caches, 'match').mockImplementation((input, options) => cache.match(input, options));
    online = false;

    const request = new Request(url, {
      mode: 'cors',
      credentials: 'include',
      headers: { Origin: 'https://www.test.com', 'Accept-Language': 'en' },
    });
    expect(await (await browserFetch(request)).json()).toStrictEqual(data);
    online = true;
    networkResponse = new Response(JSON.stringify(updatedData), {
      headers: { Vary: 'Origin, Accept-Language' },
    });
    expect(await (await browserFetch(request)).json()).toStrictEqual(updatedData);
    online = false;
    expect(await (await browserFetch(request)).json()).toStrictEqual(updatedData);
    await expect(
      browserFetch(
        new Request(request, {
          headers: { Origin: 'https://www.test.com', 'Accept-Language': 'nl' },
        }),
      ),
    ).rejects.toThrow('Network unavailable');
  },
);

it('serves a previously loaded opaque app image offline', async () => {
  const request = new Request('https://studio.example/api/apps/2/assets/lamp');
  Object.defineProperty(request, 'destination', { value: 'image' });
  networkResponse = new Response(null, { status: 0 });
  expect((await browserFetch(request)).type).toBe('opaque');

  online = false;
  expect((await browserFetch(request)).type).toBe('opaque');
});

it('loads the replacement of a named app asset', async () => {
  const request = new Request('https://studio.example/api/apps/2/assets/lamp');
  networkResponse = new Response('Original lamp');
  await browserFetch(request);
  networkResponse = new Response('Replacement lamp');

  expect(await (await browserFetch(request)).text()).toBe('Replacement lamp');
});

it('serves a successful response that the cache cannot store', async () => {
  const request = new Request('https://studio.example/api/apps/2/messages/en');
  const cache = await caches.open('appsemble');
  vi.spyOn(cache, 'put').mockRejectedValue(
    new DOMException('Quota exceeded', 'QuotaExceededError'),
  );
  networkResponse = new Response(JSON.stringify({ messages: { title: 'Routine' } }));
  expect(await (await browserFetch(request)).json()).toStrictEqual({
    messages: { title: 'Routine' },
  });
});

it('responds while the response is still being stored', async () => {
  const request = new Request('https://studio.example/api/apps/2/messages/en');
  const cache = await caches.open('appsemble');
  vi.spyOn(cache, 'put').mockReturnValue(new Promise(noop));
  networkResponse = new Response(JSON.stringify({ messages: { title: 'Routine' } }));
  expect(await (await browserFetch(request)).json()).toStrictEqual({
    messages: { title: 'Routine' },
  });
});

it('does not retain an unsuccessful image response for offline use', async () => {
  const request = new Request('https://studio.example/api/apps/2/assets/missing');
  Object.defineProperty(request, 'destination', { value: 'image' });
  networkResponse = new Response('Missing image', { status: 404 });
  expect((await browserFetch(request)).status).toBe(404);

  online = false;
  await expect(browserFetch(request)).rejects.toThrow('Network unavailable');
});
