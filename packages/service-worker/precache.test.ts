import makeServiceWorkerEnv from 'service-worker-mock';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

let online: boolean;
let body: string;
let finishEvents: () => Promise<unknown>;

// The destination a browser gives to stylesheet, script, image and font requests.
const destinations: Record<string, RequestDestination> = {
  css: 'style',
  js: 'script',
  png: 'image',
  woff2: 'font',
};

async function browserFetch(url: string): Promise<Response> {
  const request = new Request(url);
  Object.defineProperty(request, 'destination', {
    value: destinations[new URL(url).pathname.split('.').pop()!] ?? '',
  });
  const response = await trigger('fetch', request);
  return response ?? fetch(request);
}

beforeEach(async () => {
  vi.resetModules();
  const env = makeServiceWorkerEnv();
  Object.assign(globalThis, env, { appAssets: [] });
  finishEvents = (
    env as typeof env & {
      ExtendableEvent: { eventsDoneWaiting: () => Promise<unknown> };
    }
  ).ExtendableEvent.eventsDoneWaiting;
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
  await finishEvents();
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
  await finishEvents();
  online = false;

  const document = await browserFetch(documentUrl);
  expect(await document.text()).toBe('New app revision');
  const style = await browserFetch(styleUrl);
  expect(await style.text()).toBe('New app revision');
});

it('leaves external API requests to the browser', async () => {
  const url = 'https://api.example/api/apps/2/members/current/groups';
  const cache = await caches.open('appsemble');
  await cache.put(new Request(url), new Response('Cached groups'));
  expect(await (await browserFetch(url)).text()).toBe('Current app asset');
  online = false;
  await expect(browserFetch(url)).rejects.toThrow('Network unavailable');
});

it('loads stylesheet imports, glyph fonts and background images on an unvisited page offline', async () => {
  const root = 'https://www.test.com';
  const stylesheet = `${root}/fa/all.css`;
  const resources = new Map([
    [
      stylesheet,
      [
        '@import "https://fonts.example/styles.css"; .icon { src: url(../fonts/icons.woff2) }',
        'text/css',
      ],
    ],
    [
      'https://fonts.example/styles.css',
      [
        '@font-face { src: url(font.woff2) } .page { background: url(/background.png) }',
        'text/css',
      ],
    ],
    [`${root}/fonts/icons.woff2`, ['Icon glyphs', 'font/woff2']],
    ['https://fonts.example/font.woff2', ['Display font', 'font/woff2']],
    ['https://fonts.example/background.png', ['Page background', 'image/png']],
  ]);
  vi.stubGlobal('fetch', (request: Request) => {
    if (!online) {
      return Promise.reject(new TypeError('Network unavailable'));
    }
    const [content, type] = resources.get(request.url) ?? ['App document', 'text/html'];
    const response = new Response(content, { headers: { 'content-type': type } });
    Object.defineProperty(response, 'url', { value: request.url });
    return Promise.resolve(response);
  });
  await trigger('message', {
    data: { type: 'appsemble.precache', documentUrl: `${root}/en`, urls: [stylesheet] },
  });
  await finishEvents();
  online = false;

  for (const [url, [content]] of resources) {
    expect(await (await browserFetch(url)).text()).toBe(content);
  }
});

it('serves SVG bytes offline for any size without substituting raster crops', async () => {
  const url = 'https://api.example/api/apps/2/assets/routine-icon';
  vi.stubGlobal('fetch', (request: Request) => {
    if (!online) {
      return Promise.reject(new TypeError('Network unavailable'));
    }
    return Promise.resolve(
      new Response('Original routine image', {
        headers: {
          'content-type': request.url.endsWith('photo') ? 'image/jpeg' : 'image/svg+xml',
        },
      }),
    );
  });
  await trigger('message', {
    data: {
      type: 'appsemble.precache',
      documentUrl: 'https://www.test.com/en',
      urls: [url, `${url}-photo`],
    },
  });
  await finishEvents();
  online = false;
  expect(await (await browserFetch(`${url}?width=24&height=24`)).text()).toBe(
    'Original routine image',
  );
  await expect(browserFetch(`${url}-photo?width=24&height=24`)).rejects.toThrow(
    'Network unavailable',
  );
  await expect(browserFetch(`${url}?width=24&token=another-user`)).rejects.toThrow(
    'Network unavailable',
  );
});

it('starts the installed app offline using its manifest URL without a language prefix', async () => {
  const root = 'https://www.test.com';
  vi.stubGlobal('fetch', (request: Request) => {
    if (!online) {
      return Promise.reject(new TypeError('Network unavailable'));
    }
    return Promise.resolve(
      new Response(
        request.url.endsWith('manifest.json')
          ? JSON.stringify({ start_url: '/my-lamps', icons: [{ src: '/icon-192.png' }] })
          : 'Installed app',
      ),
    );
  });
  await trigger('message', {
    data: {
      type: 'appsemble.precache',
      documentUrl: `${root}/en`,
      urls: [`${root}/manifest.json`],
    },
  });
  await finishEvents();
  online = false;
  expect(await (await browserFetch(`${root}/my-lamps`)).text()).toBe('Installed app');
  expect(await (await browserFetch(`${root}/icon-192.png`)).text()).toBe('Installed app');
});
