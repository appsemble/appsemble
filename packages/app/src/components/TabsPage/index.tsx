import type { TabsPageDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import classNames from 'classnames';
import React, { ComponentPropsWithoutRef, ReactElement } from 'react';
import { Link, Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import BlockList from '../BlockList';

type TabsPageProps = Omit<ComponentPropsWithoutRef<typeof BlockList>, 'blocks'> &
  Pick<TabsPageDefinition, 'subPages'>;

export default function TabsPage({
  prefix,
  subPages,
  ...blockListProps
}: TabsPageProps): ReactElement {
  const {
    params: { subPage },
    path,
    url,
  } = useRouteMatch<{ subPage: string }>();

  return (
    <>
      <div className="tabs is-centered is-medium">
        <ul>
          {subPages.map(({ name }) => (
            <li key={name} className={classNames({ 'is-active': normalize(name) === subPage })}>
              <Link to={`${normalize(name)}`}>{name}</Link>
            </li>
          ))}
        </ul>
      </div>
      <Switch>
        {subPages.map(({ blocks, name }, index) => (
          <Route key={name} exact path={`${path}/${normalize(name)}`}>
            <BlockList
              {...blockListProps}
              blocks={blocks}
              prefix={`${prefix}.subPages.${index}.blocks`}
            />
          </Route>
        ))}

        <Redirect to={`${url}/${normalize(subPages[0].name)}`} />
      </Switch>
    </>
  );
}
