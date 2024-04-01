// eslint-disable-next-line import/no-extraneous-dependencies, n/no-extraneous-import
import Cli from '@appsemble/cli/README.md';
// eslint-disable-next-line import/no-extraneous-dependencies, n/no-extraneous-import
import Preact from '@appsemble/preact/README.md';
// eslint-disable-next-line import/no-extraneous-dependencies, n/no-extraneous-import
import Sdk from '@appsemble/sdk/README.md';
// eslint-disable-next-line import/no-extraneous-dependencies, n/no-extraneous-import
import WebpackConfig from '@appsemble/webpack-config/README.md';
// eslint-disable-next-line import/no-extraneous-dependencies, n/no-extraneous-import
import CreateAppsemble from 'create-appsemble/README.md';

export function applyPackages<T>(documents: T[]): void {
  for (const doc of [
    { Component: Cli, path: '08-packages/cli', title: '@appsemble/cli' },
    { Component: Preact, path: '08-packages/preact', title: '@appsemble/preact' },
    { Component: Sdk, path: '08-packages/sdk', title: '@appsemble/sdk' },
    {
      Component: WebpackConfig,
      path: '08-packages/webpack-config',
      title: '@appsemble/webpack-config',
    },
    { Component: CreateAppsemble, path: '08-packages/create-appsemble', title: 'create-appsemble' },
  ]) {
    documents.push({
      ...doc,
      searchIndex: [],
    } as T);
  }
}
