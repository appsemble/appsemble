import { type AppDefinition, iterApp, iterPage } from '@appsemble/lang-sdk';
import { type BlockManifest } from '@appsemble/types';
import { createThemeURL, mergeThemes } from '@appsemble/utils';

import { getBlockFileURL } from './bootstrapper.js';

/**
 * Collect static files needed by every declared block, including hidden blocks and dialogs.
 *
 * @param definition The app definition.
 * @param manifests The resolved block manifests.
 * @param updated The app revision used by its stylesheets.
 * @returns The static asset URLs.
 */
export function getAppAssets(
  definition: AppDefinition,
  manifests: BlockManifest[],
  updated: string,
): string[] {
  const urls = new Set([`/shared.css?updated=${updated}`]);
  for (const manifest of manifests) {
    urls.add(`/${manifest.name}.css?updated=${updated}`);
    for (const file of manifest.files) {
      if (!file.endsWith('.map')) {
        urls.add(getBlockFileURL(manifest, file));
      }
    }
  }

  const pageThemes: AppDefinition['theme'][] = [];
  iterApp(definition, {
    onPage(page) {
      pageThemes.push(page.theme);
      iterPage(page, {
        onPage: (child) => child !== page,
        onBlock(block) {
          urls.add(
            createThemeURL(
              mergeThemes(definition.theme ?? {}, page.theme ?? {}, block.theme ?? {}),
            ),
          );
        },
      });
    },
  });
  iterApp(definition, {
    onBlock(block, path) {
      if (path[0] !== 'pages') {
        for (const theme of pageThemes) {
          urls.add(
            createThemeURL(mergeThemes(definition.theme ?? {}, theme ?? {}, block.theme ?? {})),
          );
        }
      }
    },
  });
  return [...urls];
}
