// eslint-disable-next-line import-x/no-extraneous-dependencies
import Cli from '@appsemble/cli/README.md';
// eslint-disable-next-line import-x/no-extraneous-dependencies
import Preact from '@appsemble/preact/README.md';
// eslint-disable-next-line import-x/no-extraneous-dependencies
import Sdk from '@appsemble/sdk/README.md';
// eslint-disable-next-line import-x/no-extraneous-dependencies
import WebpackConfig from '@appsemble/webpack-config/README.md';
// eslint-disable-next-line import-x/no-extraneous-dependencies
import CreateAppsemble from 'create-appsemble/README.md';

export function applyPackages<T>(documents: T[]): void {
  for (const doc of [
    { Component: Cli, path: 'packages/cli', title: '@appsemble/cli' },
    { Component: Preact, path: 'packages/preact', title: '@appsemble/preact' },
    { Component: Sdk, path: 'packages/sdk', title: '@appsemble/sdk' },
    {
      Component: WebpackConfig,
      path: 'packages/webpack-config',
      title: '@appsemble/webpack-config',
    },
    { Component: CreateAppsemble, path: 'packages/create-appsemble', title: 'create-appsemble' },
  ]) {
    documents.push({
      ...doc,
      searchIndex: [],
    } as T);
  }
}
