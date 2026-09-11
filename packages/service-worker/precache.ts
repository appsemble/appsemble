// CSpell:ignore Atrule
import { parse, walk } from 'css-tree';

import { cacheFirst, requestFirst } from './utils.js';

/**
 * Cache declared files and the images, fonts and imports referenced by their stylesheets.
 *
 * @param urls The app's static file URLs.
 */
export async function precache(urls: string[]): Promise<void> {
  const visited = new Set<string>();

  async function visit(url: string): Promise<void> {
    if (visited.has(url)) {
      return;
    }
    visited.add(url);
    const isManifest = new URL(url).pathname === '/manifest.json';
    const response = await (isManifest ? requestFirst : cacheFirst)(new Request(url));
    if (isManifest && response.ok) {
      const manifest = await response.json();
      await Promise.all([
        requestFirst(new Request(new URL(manifest.start_url, url))),
        ...manifest.icons.map(({ src }: { src: string }) => visit(new URL(src, url).href)),
      ]);
      return;
    }
    if (!response.ok || !response.headers.get('content-type')?.includes('text/css')) {
      return;
    }

    const dependencies = new Set<string>();
    walk(parse(await response.text()), (node) => {
      let value: string | undefined;
      if (node.type === 'Url') {
        value = node.value;
      } else if (
        node.type === 'Atrule' &&
        node.name === 'import' &&
        node.prelude?.type === 'AtrulePrelude'
      ) {
        const { first } = node.prelude.children;
        if (first?.type === 'String') {
          value = first.value;
        }
      }
      if (value) {
        const dependency = new URL(value, response.url || url);
        if (['http:', 'https:'].includes(dependency.protocol)) {
          dependencies.add(dependency.href);
        }
      }
    });
    await Promise.all([...dependencies].map(visit));
  }

  await Promise.all(urls.map(visit));
}
