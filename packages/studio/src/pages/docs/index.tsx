import { MenuItem, MenuSection, MetaSwitch, useSideMenu } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { AppPage } from './AppPage';
import { Doc } from './Doc';
import { messages } from './messages';

const context = require.context('../../../../../docs', true, /\.mdx?$/);
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
                {getUrl(p, url).endsWith('/docs/reference') && (
                  <MenuItem exact to={getUrl('reference/app', url)}>
                    <FormattedMessage {...messages.app} />
                  </MenuItem>
                )}
                {subRoutes.map((subRoute) => (
                  <MenuItem key={subRoute.p} to={getUrl(subRoute.p, url)}>
                    {subRoute.title}
                  </MenuItem>
                ))}
              </MenuSection>
            ) : null,
          ];
        })}
    </MenuSection>,
  );

  return (
    <MetaSwitch title={messages.title}>
      <Route exact path={`${url}/reference/app`}>
        <AppPage />
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
