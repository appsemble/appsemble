import { Tab, Tabs } from '@appsemble/react-components';
import { TabsPageDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import React, { ChangeEvent, ComponentPropsWithoutRef, ReactElement, useCallback } from 'react';
import { Redirect, Route, Switch, useHistory, useLocation, useRouteMatch } from 'react-router-dom';

import { useAppMessages } from '../AppMessagesProvider';
import { BlockList } from '../BlockList';

type TabsPageProps = Omit<ComponentPropsWithoutRef<typeof BlockList>, 'blocks'> &
  Pick<TabsPageDefinition, 'subPages'>;

export function TabsPage({ prefix, subPages, ...blockListProps }: TabsPageProps): ReactElement {
  const { path, url } = useRouteMatch();
  const { getMessage } = useAppMessages();
  const { pathname } = useLocation();
  const history = useHistory();

  const onChange = useCallback((event: ChangeEvent, value: string) => history.push(value), [
    history,
  ]);

  return (
    <>
      <Tabs centered onChange={onChange} size="medium" value={pathname}>
        {subPages.map(({ name }, index) => {
          const translatedName = getMessage({
            id: `${prefix}.subPages.${index}`,
            defaultMessage: name,
          }).format() as string;
          const value = `${url}/${normalize(translatedName)}`;

          return (
            <Tab href={value} key={name} value={value}>
              {translatedName}
            </Tab>
          );
        })}
      </Tabs>
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
          const fromPath = `${path}/${normalize(name)}`;
          return <Redirect from={fromPath} key={exactPath} to={exactPath} />;
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
