import { MetaSwitch, Tab, Tabs } from '@appsemble/react-components';
import { TabsPageDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import { ChangeEvent, ComponentPropsWithoutRef, ReactElement, useCallback } from 'react';
import { Navigate, Route, useLocation, useNavigate, useParams } from 'react-router-dom';

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
  const { lang, pageId } = useParams<{ lang: string; pageId: string }>();
  const { getAppMessage } = useAppMessages();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const onChange = useCallback((event: ChangeEvent, value: string) => navigate(value), [navigate]);

  const pageName = getAppMessage({ id: prefix, defaultMessage: page.name }).format() as string;

  return (
    <>
      <Tabs centered onChange={onChange} size="medium" value={pathname}>
        {page.tabs.map(({ name }, index) => {
          const translatedName = getAppMessage({
            id: `${prefix}.tabs.${index}`,
            defaultMessage: name,
          }).format() as string;
          const value = `/${lang}/${pageId}/${normalize(translatedName)}`;

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
            <Route
              element={
                <TabContent
                  key={prefix}
                  {...blockListProps}
                  blocks={blocks}
                  name={translatedName}
                  page={page}
                  prefix={`${prefix}.tabs.${index}.blocks`}
                  prefixIndex={`${prefixIndex}.tabs.${index}.blocks`}
                />
              }
              key={name}
              path={`/${normalize(translatedName)}`}
            />
          );
        })}
        {/* Redirect from a matching sub URL to the actual URL */}
        {page.tabs.map(({ name }, index) => {
          const translatedName = getAppMessage({
            id: `${prefix}.tabs.${index}`,
            defaultMessage: name,
          }).format() as string;

          const exactPath = `/${lang}/${pageId}/${normalize(translatedName)}`;
          return <Route element={<Navigate to={exactPath} />} key={exactPath} path="/*" />;
        })}

        <Route
          element={
            <Navigate
              to={`/${lang}/${pageId}/${normalize(
                getAppMessage({
                  id: `${prefix}.tabs.0`,
                  defaultMessage: page.tabs[0].name,
                }).format() as string,
              )}`}
            />
          }
          path="/*"
        />
      </MetaSwitch>
    </>
  );
}
