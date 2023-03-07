// eslint-disable-next-line import/no-extraneous-dependencies, n/no-extraneous-import
import Cli from '@appsemble/cli/README.md';
// eslint-disable-next-line import/no-extraneous-dependencies, n/no-extraneous-import
import Preact from '@appsemble/preact/README.md';
import { MenuItem, MenuSection, MetaSwitch, useSideMenu } from '@appsemble/react-components';
// eslint-disable-next-line import/no-extraneous-dependencies, n/no-extraneous-import
import Sdk from '@appsemble/sdk/README.md';
// eslint-disable-next-line import/no-extraneous-dependencies, n/no-extraneous-import
import WebpackConfig from '@appsemble/webpack-config/README.md';
// eslint-disable-next-line import/no-extraneous-dependencies, n/no-extraneous-import
import CreateAppsemble from 'create-appsemble/README.md';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate, Route, useParams } from 'react-router-dom';

import Changelog from '../../../../CHANGELOG.md';
import { Doc } from './Doc/index.js';
import { messages } from './messages.js';
import { ReferenceRoutes } from './reference/index.js';

const context = require.context('../../../../docs', true, /\.mdx?$/);

const docs = context
  .keys()
  .map((key) => {
    const { default: Component, icon, title } = context(key) as typeof import('*.md');
    return {
      Component,
      icon,
      p: key
        .replace(/^\.\//, '')
        .replace(/\.mdx?$/, '')
        .replace(/(^|\/)index$/, '/'),
      title,
    };
  })
  .sort((a, b) => a.p.localeCompare(b.p));

function getUrl(p: string, base: string): string {
  return p === '/' ? base : `${base}/${p.replace(/\/$/, '')}`;
}

/**
 * Render the documentation in the root of the Appsemble repository.
 */
export function DocsRoutes(): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const url = `/${lang}/docs`;

  useSideMenu(
    <MenuSection label={<FormattedMessage {...messages.title} />}>
      {docs
        .filter(({ p }) => p.endsWith('/'))
        .map(({ icon, p, title }) => {
          const subRoutes = docs.filter((subRoute) => subRoute.p !== p && subRoute.p.startsWith(p));
          return [
            <MenuItem exact icon={icon} key="docs-title" to={getUrl(p, url)}>
              {title}
            </MenuItem>,
            subRoutes.length ? (
              <MenuSection key="docs-section">
                {subRoutes.map((subRoute) => (
                  <MenuItem key={subRoute.p} to={getUrl(subRoute.p, url)}>
                    {subRoute.title}
                  </MenuItem>
                ))}
              </MenuSection>
            ) : null,
          ];
        })}
      <MenuItem exact icon="book" to={`${url}/reference`}>
        <FormattedMessage {...messages.reference} />
      </MenuItem>
      <MenuSection>
        <MenuItem exact to={`${url}/reference/app`}>
          <FormattedMessage {...messages.app} />
        </MenuItem>
        <MenuItem exact to={`${url}/reference/action`}>
          <FormattedMessage {...messages.action} />
        </MenuItem>
        <MenuItem exact to={`${url}/reference/remapper`}>
          <FormattedMessage {...messages.remapper} />
        </MenuItem>
      </MenuSection>
      <MenuItem exact icon="cubes" to={`${url}/packages`}>
        <FormattedMessage {...messages.packages} />
      </MenuItem>
      <MenuSection>
        <MenuItem to={`${url}/packages/cli`}>@appsemble/cli</MenuItem>
        <MenuItem to={`${url}/packages/preact`}>@appsemble/preact</MenuItem>
        <MenuItem to={`${url}/packages/sdk`}>@appsemble/sdk</MenuItem>
        <MenuItem to={`${url}/packages/webpack-config`}>@appsemble/webpack-config</MenuItem>
        <MenuItem to={`${url}/packages/create-appsemble`}>create-appsemble</MenuItem>
      </MenuSection>
      <MenuItem exact icon="scroll" to={`${url}/changelog`}>
        <FormattedMessage {...messages.changelog} />
      </MenuItem>
    </MenuSection>,
  );

  return (
    <MetaSwitch title={messages.title}>
      <Route element={<Changelog />} path="/changelog" />
      <Route element={<Cli />} path="/packages/cli" />
      <Route element={<Preact />} path="/packages/preact" />
      <Route element={<Sdk />} path="/packages/sdk" />
      <Route element={<WebpackConfig />} path="/packages/webpack-config" />
      <Route element={<CreateAppsemble />} path="/packages/create-appsemble" />
      <Route element={<ReferenceRoutes />} path="/reference/*" />
      {docs.map(({ Component, p, title }) => (
        <Route element={<Doc component={Component} title={title} />} key={p} path={getUrl(p, '')} />
      ))}
      {docs.map(({ p }) => (
        <Route element={<Navigate to={getUrl(p, '')} />} key={p} path="*" />
      ))}
      <Route element={<Navigate to={url} />} path="*" />
    </MetaSwitch>
  );
}
