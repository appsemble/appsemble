import { MenuItem, MenuSection, MetaSwitch, useSideMenu } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

// eslint-disable-next-line node/no-unpublished-import
import Changelog from '../../../../CHANGELOG.md';
import { Doc } from './Doc';
import { messages } from './messages';
import { ReferenceRoutes } from './reference';

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
 * Render the documentation in the root of the Apsemble repository.
 */
export function DocsRoutes(): ReactElement {
  const { path, url } = useRouteMatch();

  useSideMenu(
    <MenuSection label={<FormattedMessage {...messages.title} />}>
      {docs
        .filter(({ p }) => p.endsWith('/'))
        .map(({ icon, p, title }) => {
          const subRoutes = docs.filter((subRoute) => subRoute.p !== p && subRoute.p.startsWith(p));
          return [
            <MenuItem exact icon={icon} key={`${path}-title`} to={getUrl(p, url)}>
              {title}
            </MenuItem>,
            subRoutes.length ? (
              <MenuSection key={`${path}-section`}>
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
      <MenuItem exact icon="scroll" to={`${url}/changelog`}>
        <FormattedMessage {...messages.changelog} />
      </MenuItem>
    </MenuSection>,
  );

  return (
    <MetaSwitch title={messages.title}>
      <Route path={`${path}/changelog`}>
        <Changelog />
      </Route>
      <Route path={`${path}/reference`}>
        <ReferenceRoutes />
      </Route>
      {docs.map(({ Component, p, title }) => (
        <Route exact key={p} path={getUrl(p, path)} strict>
          <Doc component={Component} title={title} />
        </Route>
      ))}
      {docs.map(({ p }) => (
        <Redirect exact from={`${getUrl(p, path)}/`} key={p} to={getUrl(p, path)} />
      ))}
      <Redirect to={url} />
    </MetaSwitch>
  );
}
