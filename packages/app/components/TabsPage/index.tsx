import { MetaSwitch, Tab, Tabs } from '@appsemble/react-components';
import { TabsPageDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import { ChangeEvent, ComponentPropsWithoutRef, ReactElement, useCallback } from 'react';
import { Redirect, Route, useHistory, useLocation, useRouteMatch } from 'react-router-dom';

import { useAppMessages } from '../AppMessagesProvider/index.js';
import { BlockList } from '../BlockList/index.js';
import { TabContent } from './TabContent/index.js';

interface TabsPageProps extends Omit<ComponentPropsWithoutRef<typeof BlockList>, 'blocks'> {
  page: TabsPageDefinition;
}

export function TabsPage({
  page,
  prefix,
  prefixIndex,
  ...blockListProps
}: TabsPageProps): ReactElement {
  const { path, url } = useRouteMatch();
  const { getAppMessage } = useAppMessages();
  const { pathname } = useLocation();
  const history = useHistory();

  const onChange = useCallback(
    (event: ChangeEvent, value: string) => history.push(value),
    [history],
  );

  const pageName = getAppMessage({ id: prefix, defaultMessage: page.name }).format() as string;

  return (
    <>
      <Tabs centered onChange={onChange} size="medium" value={pathname}>
        {page.tabs.map(({ name }, index) => {
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
      <MetaSwitch title={pageName}>
        {page.tabs.map(({ blocks, name }, index) => {
          const translatedName = getAppMessage({
            id: `${prefix}.tabs.${index}`,
            defaultMessage: name,
          }).format() as string;

          return (
            <Route exact key={name} path={`${path}/${normalize(translatedName)}`}>
              <TabContent
                key={prefix}
                {...blockListProps}
                blocks={blocks}
                name={translatedName}
                page={page}
                prefix={`${prefix}.tabs.${index}.blocks`}
                prefixIndex={`${prefixIndex}.tabs.${index}.blocks`}
              />
            </Route>
          );
        })}
        {/* Redirect from a matching sub URL to the actual URL */}
        {page.tabs.map(({ name }, index) => {
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
              defaultMessage: page.tabs[0].name,
            }).format() as string,
          )}`}
        />
      </MetaSwitch>
    </>
  );
}
