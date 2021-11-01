import { Tab, Tabs } from '@appsemble/react-components';
import { TabsPageDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import { ChangeEvent, ComponentPropsWithoutRef, ReactElement, useCallback } from 'react';
import { Redirect, Route, Switch, useHistory, useLocation, useRouteMatch } from 'react-router-dom';

import { useAppMessages } from '../AppMessagesProvider';
import { BlockList } from '../BlockList';

type TabsPageProps = Omit<ComponentPropsWithoutRef<typeof BlockList>, 'blocks'> &
  Pick<TabsPageDefinition, 'tabs'>;

export function TabsPage({ prefix, tabs, ...blockListProps }: TabsPageProps): ReactElement {
  const { path, url } = useRouteMatch();
  const { getAppMessage } = useAppMessages();
  const { pathname } = useLocation();
  const history = useHistory();

  const onChange = useCallback(
    (event: ChangeEvent, value: string) => history.push(value),
    [history],
  );

  return (
    <>
      <Tabs centered onChange={onChange} size="medium" value={pathname}>
        {tabs.map(({ name }, index) => {
          const translatedName = getAppMessage({
            id: `${prefix}.tabs.${index}`,
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
        {tabs.map(({ blocks, name }, index) => {
          const translatedName = getAppMessage({
            id: `${prefix}.tabs.${index}`,
            defaultMessage: name,
          }).format() as string;

          return (
            <Route exact key={name} path={`${path}/${normalize(translatedName)}`}>
              <BlockList
                key={prefix}
                {...blockListProps}
                blocks={blocks}
                prefix={`${prefix}.tabs.${index}.blocks`}
              />
            </Route>
          );
        })}
        {/* Redirect from a matching sub URL to the actual URL */}
        {tabs.map(({ name }, index) => {
          const translatedName = getAppMessage({
            id: `${prefix}.tabs.${index}`,
            defaultMessage: name,
          }).format() as string;

          const exactPath = `${path}/${normalize(translatedName)}`;
          const fromPath = `${path}/${normalize(name)}`;
          return <Redirect from={fromPath} key={exactPath} to={exactPath} />;
        })}

        <Redirect
          to={`${url}/${normalize(
            getAppMessage({
              id: `${prefix}.tabs.0`,
              defaultMessage: tabs[0].name,
            }).format() as string,
          )}`}
        />
      </Switch>
    </>
  );
}
