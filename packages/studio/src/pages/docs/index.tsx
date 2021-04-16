import { MenuItem, MenuSection, MetaSwitch, useSideMenu } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

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
      path: key
        .replace(/^\.\//, '')
        .replace(/\.mdx?$/, '')
        .replace(/(^|\/)index$/, '/'),
      title,
    };
  })
  .sort((a, b) => a.path.localeCompare(b.path));

/**
 * Render the documentation in the root of the Apsemble repository.
 */
export function DocsRoutes(): ReactElement {
  const { url } = useRouteMatch();

  function getUrl(path: string): string {
    return path === '/' ? url : `${url}/${path.replace(/\/$/, '')}`;
  }

  useSideMenu(
    <MenuSection label={<FormattedMessage {...messages.title} />}>
      {docs
        .filter(({ path }) => path.endsWith('/'))
        .map(({ icon, path, title }) => {
          const subRoutes = docs.filter(
            (subRoute) => subRoute.path !== path && subRoute.path.startsWith(path),
          );
          return [
            <MenuItem exact icon={icon} key={`${path}-title`} to={getUrl(path)}>
              {title}
            </MenuItem>,
            subRoutes.length ? (
              <MenuSection key={`${path}-section`}>
                {subRoutes.map((subRoute) => (
                  <MenuItem key={subRoute.path} to={getUrl(subRoute.path)}>
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
      {docs.map(({ Component, path, title }) => (
        <Route exact key={path} path={getUrl(path)} strict>
          <Doc component={Component} title={title} />
        </Route>
      ))}
      {docs.map(({ path }) => (
        <Redirect exact from={`${getUrl(path)}/`} key={path} to={getUrl(path)} />
      ))}
      <Redirect to={url} />
    </MetaSwitch>
  );
}
