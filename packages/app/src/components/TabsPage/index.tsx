import type { TabsPageDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import classNames from 'classnames';
import React, { ComponentPropsWithoutRef, ReactElement } from 'react';
import { Link, Redirect, Route, Switch, useLocation, useRouteMatch } from 'react-router-dom';

import { useAppMessages } from '../AppMessagesProvider';
import { BlockList } from '../BlockList';

type TabsPageProps = Omit<ComponentPropsWithoutRef<typeof BlockList>, 'blocks'> &
  Pick<TabsPageDefinition, 'subPages'>;

export function TabsPage({ prefix, subPages, ...blockListProps }: TabsPageProps): ReactElement {
  const { path, url } = useRouteMatch();
  const { getMessage } = useAppMessages();
  const { pathname } = useLocation();

  return (
    <>
      <div className="tabs is-centered is-medium">
        <ul>
          {subPages.map(({ name }, index) => {
            const translatedName = getMessage({
              id: `${prefix}.subPages.${index}`,
              defaultMessage: name,
            }).format() as string;

            return (
              <li
                className={classNames({
                  'is-active': pathname.endsWith(normalize(translatedName)),
                })}
                key={name}
              >
                <Link to={normalize(translatedName)}>{translatedName}</Link>
              </li>
            );
          })}
        </ul>
      </div>
      <Switch>
        {subPages.map(({ blocks, name }, index) => {
          const translatedName = getMessage({
            id: `${prefix}.subPages.${index}`,
            defaultMessage: name,
          }).format() as string;

          return (
            <Route exact key={name} path={`${path}/${normalize(translatedName)}`}>
              <BlockList
                {...blockListProps}
                blocks={blocks}
                key={prefix}
                prefix={`${prefix}.subPages.${index}.blocks`}
              />
            </Route>
          );
        })}
        {/* Redirect from a matching sub URL to the actual URL */}
        {subPages.map(({ name }, index) => {
          const translatedName = getMessage({
            id: `${prefix}.subPages.${index}`,
            defaultMessage: name,
          }).format() as string;

          const exactPath = `${path}/${normalize(translatedName)}`;
          return <Redirect from={exactPath} key={exactPath} to={exactPath} />;
        })}

        <Redirect
          to={`${url}/${normalize(
            getMessage({
              id: `${prefix}.subPages.0`,
              defaultMessage: subPages[0].name,
            }).format() as string,
          )}`}
        />
      </Switch>
    </>
  );
}
