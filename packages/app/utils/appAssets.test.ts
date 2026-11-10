import { type AppDefinition } from '@appsemble/lang-sdk';
import { type BlockManifest } from '@appsemble/types';
import { expect, it } from 'vitest';

import { getAppAssets } from './appAssets.js';

it('includes hidden and dialog block files and styles for the current app revision', () => {
  const definition = {
    name: 'Offline app',
    defaultPage: 'Home',
    pages: [
      {
        name: 'Home',
        blocks: [{ type: 'button-list', version: '1.0.0' }],
      },
      {
        name: 'Advanced',
        blocks: [{ type: 'detail-viewer', version: '1.0.0', hide: true }],
      },
    ],
    controller: {
      actions: {
        settings: { type: 'dialog', blocks: [{ type: 'form', version: '1.0.0' }] },
      },
    },
  } as AppDefinition;
  const manifests = [
    { name: '@appsemble/button-list', version: '1.0.0', files: ['button-list.js'] },
    {
      name: '@appsemble/detail-viewer',
      version: '1.0.0',
      files: ['detail-viewer.js', 'detail-viewer.css', 'icon.svg'],
      fileUrls: {
        'detail-viewer.js': 'https://cdn.example/detail-viewer.js',
        'detail-viewer.css': 'https://cdn.example/detail-viewer.css',
        'icon.svg': 'https://cdn.example/icon.svg',
      },
    },
    { name: '@appsemble/form', version: '1.0.0', files: ['form.js'] },
  ] as BlockManifest[];
  const assets = getAppAssets(definition, manifests, 'current-revision');
  expect(assets).toStrictEqual(
    expect.arrayContaining([
      '/@appsemble/detail-viewer.css?updated=current-revision',
      '/@appsemble/form.css?updated=current-revision',
      '/shared.css?updated=current-revision',
      'https://cdn.example/detail-viewer.js',
      'https://cdn.example/detail-viewer.css',
      'https://cdn.example/icon.svg',
    ]),
  );
});

it('includes the theme of an unvisited page and its block overrides', () => {
  const assets = getAppAssets(
    {
      name: 'Themed app',
      defaultPage: 'Home',
      theme: { primaryColor: '#111111' },
      pages: [
        { name: 'Home', blocks: [{ type: 'html', version: '1.0.0' }] },
        {
          name: 'Advanced',
          theme: { primaryColor: '#222222' },
          blocks: [
            { type: 'html', version: '1.0.0' },
            { type: 'html', version: '1.0.0', theme: { primaryColor: '#333333' } },
          ],
        },
      ],
    },
    [],
    'current-revision',
  );
  const primaryColors = assets
    .filter((url) => url.startsWith('/bulma/'))
    .map((url) => new URL(url, 'https://app.example').searchParams.get('primaryColor'));
  expect(primaryColors).toStrictEqual(expect.arrayContaining(['#111111', '#222222', '#333333']));
});
