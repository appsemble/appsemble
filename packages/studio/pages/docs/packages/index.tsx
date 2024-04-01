// eslint-disable-next-line import/no-extraneous-dependencies, n/no-extraneous-import
import Cli from '@appsemble/cli/README.md';
// eslint-disable-next-line import/no-extraneous-dependencies, n/no-extraneous-import
import Preact from '@appsemble/preact/README.md';
import { MetaSwitch, useMeta } from '@appsemble/react-components';
// eslint-disable-next-line import/no-extraneous-dependencies, n/no-extraneous-import
import Sdk from '@appsemble/sdk/README.md';
import { defaultLocale } from '@appsemble/utils';
// eslint-disable-next-line import/no-extraneous-dependencies, n/no-extraneous-import
import WebpackConfig from '@appsemble/webpack-config/README.md';
// eslint-disable-next-line import/no-extraneous-dependencies, n/no-extraneous-import
import CreateAppsemble from 'create-appsemble/README.md';
import { type ReactNode } from 'react';
import { Route } from 'react-router-dom';

import Introduction from './introduction.md';
import { messages } from './messages.js';

export function PackageRoutes(): ReactNode {
  useMeta(messages.title, messages.description);
  return (
    <main lang={defaultLocale}>
      <MetaSwitch>
        <Route element={<Introduction />} path="/" />
        <Route element={<Cli />} path="/cli" />
        <Route element={<Preact />} path="/preact" />
        <Route element={<Sdk />} path="/sdk" />
        <Route element={<WebpackConfig />} path="/webpack-config" />
        <Route element={<CreateAppsemble />} path="/create-appsemble" />
      </MetaSwitch>
    </main>
  );
}
