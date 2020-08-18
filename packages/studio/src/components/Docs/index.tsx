import { useToggle } from '@appsemble/react-components/src';
import type { IconName } from '@fortawesome/fontawesome-common-types';
import React, { FunctionComponent, ReactElement } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { NavLink } from '../NavLink';
import { SideMenu } from '../SideMenu';
import { SideNavLink } from '../SideNavLink';
import styles from './index.css';

interface MDXModule {
  default: FunctionComponent;
  meta: {
    icon: IconName;
  };
  title: string;
}

const context = require.context('../../../../../docs', true, /\.mdx?$/);
const docs = context
  .keys()
  .map((key) => {
    const { default: Component, meta, title } = context(key) as MDXModule;
    return {
      Component,
      icon: meta?.icon,
      path: key
        .replace(/^\.\//, '')
        .replace(/\.mdx?$/, '')
        .replace(/(^|\/)index$/, '/'),
      title,
    };
  })
  .sort((a, b) => a.path.localeCompare(b.path));

export function Docs(): ReactElement {
  const { url } = useRouteMatch();
  const collapsed = useToggle();

  return (
    <div className="is-flex">
      <SideMenu isCollapsed={collapsed.enabled} toggleCollapse={collapsed.toggle}>
        {docs
          .filter(({ path }) => path.endsWith('/'))
          .map(({ icon, path, title }) => (
            <SideNavLink
              exact
              icon={icon}
              key={path}
              label={title}
              to={path === '/' ? url : `${url}/${path}`}
            >
              {docs
                .filter((subRoute) => subRoute.path !== path && subRoute.path.startsWith(path))
                .map((subRoute) => (
                  <NavLink key={subRoute.path} to={`${url}/${subRoute.path}`}>
                    {subRoute.title}
                  </NavLink>
                ))}
            </SideNavLink>
          ))}
      </SideMenu>
      <main className={`container content px-6 py-4 ${styles.doc}`}>
        <Switch>
          {docs.map(({ Component, path }) => (
            <Route exact key={path} path={path === '/' ? url : `${url}/${path}`}>
              <Component />
            </Route>
          ))}
          <Redirect to={url} />
        </Switch>
      </main>
    </div>
  );
}
