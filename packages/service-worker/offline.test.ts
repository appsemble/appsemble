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

it('serves a previously loaded opaque app image offline', async () => {
  const request = new Request('https://studio.example/api/apps/2/assets/lamp');
  Object.defineProperty(request, 'destination', { value: 'image' });
  networkResponse = new Response(null, { status: 0 });
  expect((await browserFetch(request)).type).toBe('opaque');

  online = false;
  expect((await browserFetch(request)).type).toBe('opaque');
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

it('does not retain an unsuccessful image response for offline use', async () => {
  const request = new Request('https://studio.example/api/apps/2/assets/missing');
  Object.defineProperty(request, 'destination', { value: 'image' });
  networkResponse = new Response('Missing image', { status: 404 });
  expect((await browserFetch(request)).status).toBe(404);

  online = false;
  await expect(browserFetch(request)).rejects.toThrow('Network unavailable');
});
