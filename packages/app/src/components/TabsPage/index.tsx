import type { TabsPageDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import classNames from 'classnames';
import React, { ComponentPropsWithoutRef, ReactElement } from 'react';
import { Link, Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { BlockList } from '../BlockList';

type TabsPageProps = Omit<ComponentPropsWithoutRef<typeof BlockList>, 'blocks'> &
  Pick<TabsPageDefinition, 'subPages'>;

export function TabsPage({ prefix, subPages, ...blockListProps }: TabsPageProps): ReactElement {
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
            <li className={classNames({ 'is-active': normalize(name) === subPage })} key={name}>
              <Link to={normalize(name)}>{name}</Link>
            </li>
          ))}
        </ul>
      </div>
      <Switch>
        {subPages.map(({ blocks, name }, index) => (
          <Route exact key={name} path={`${path}/${normalize(name)}`}>
            <BlockList
              {...blockListProps}
              blocks={blocks}
              key={prefix}
              prefix={`${prefix}.subPages.${index}.blocks`}
            />
          </Route>
        ))}
        {/* Redirect from a matching sub URL to the actual URL */}
        {subPages.map(({ name }) => {
          const exactPath = `${path}/${normalize(name)}`;
          return <Redirect from={exactPath} key={exactPath} to={exactPath} />;
        })}

        <Redirect to={`${url}/${normalize(subPages[0].name)}`} />
      </Switch>
    </>
  );
}
