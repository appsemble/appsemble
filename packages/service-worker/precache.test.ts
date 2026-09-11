import makeServiceWorkerEnv from 'service-worker-mock';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

let online: boolean;
let body: string;

async function browserFetch(url: string): Promise<Response> {
  const request = new Request(url);
  const response = await trigger('fetch', request);
  return response ?? fetch(request);
}

beforeEach(async () => {
  vi.resetModules();
  Object.assign(globalThis, makeServiceWorkerEnv(), { appAssets: [] });
  online = true;
  body = 'Current app asset';
  vi.stubGlobal('fetch', () => {
    if (!online) {
      return Promise.reject(new TypeError('Network unavailable'));
    }
    return Promise.resolve(new Response(body));
  });
  await import('./index.js');
});

afterEach(() => vi.unstubAllGlobals());

it('serves unvisited block styles and CDN files offline after caching app assets', async () => {
  const documentUrl = 'https://www.test.com/en';
  const urls = [
    'https://www.test.com/@appsemble/detail-viewer.css?updated=current',
    'https://cdn.example/blocks/detail-viewer.js',
    'https://cdn.example/blocks/detail-viewer.css',
  ];
  await trigger('message', { data: { type: 'appsemble.precache', documentUrl, urls } });
  online = false;

  for (const url of [documentUrl, ...urls]) {
    const response = await browserFetch(url);
    expect(await response.text()).toBe('Current app asset');
  }
});

it('refreshes the app document and retains styles from its new revision', async () => {
  const documentUrl = 'https://www.test.com/en';
  const cache = await caches.open('appsemble');
  await cache.put(new Request(documentUrl), new Response('Old app document'));
  body = 'New app revision';
  const styleUrl = 'https://www.test.com/@appsemble/detail-viewer.css?updated=new';
  await trigger('message', {
    data: { type: 'appsemble.precache', documentUrl, urls: [styleUrl] },
  });
  online = false;

  const document = await browserFetch(documentUrl);
  expect(await document.text()).toBe('New app revision');
  const style = await browserFetch(styleUrl);
  expect(await style.text()).toBe('New app revision');
});

it('does not cache undeclared external requests', async () => {
  const request = new Request('https://external.example/data');
  const response = await browserFetch(request.url);
  expect(await response.text()).toBe('Current app asset');
  online = false;
  await expect(trigger('fetch', request)).rejects.toThrow('Network unavailable');
});
