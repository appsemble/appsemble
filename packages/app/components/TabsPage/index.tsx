import { Tab, Tabs } from '@appsemble/react-components';
import { TabsPageDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import { ChangeEvent, ComponentPropsWithoutRef, ReactElement, useCallback } from 'react';
import { Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';

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
  const {
    '*': pageParams,
    lang,
    pageId,
    subPage,
  } = useParams<{ lang: string; pageId: string; subPage: string; '*': string }>();
  const { getAppMessage } = useAppMessages();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const onChange = useCallback((event: ChangeEvent, value: string) => navigate(value), [navigate]);

  const normalizedSubPage = normalize(subPage);
  const tabIndex = page.tabs.findIndex((p) => normalize(p.name) === normalizedSubPage);

  const tab = tabIndex === -1 ? null : page.tabs[tabIndex];

  const translatedSubPageName = getAppMessage({
    id: `${prefix}.tabs.${tabIndex}`,
    defaultMessage: subPage,
  }).format() as string;

  return (
    <>
      <Tabs centered onChange={onChange} size="medium" value={pathname}>
        {page.tabs.map(({ name }, index) => {
          const translatedName = getAppMessage({
            id: `${prefix}.tabs.${index}`,
            defaultMessage: name,
          }).format() as string;

          const value = ['', lang, pageId, normalize(translatedName), pageParams].join('/');

          return (
            <Tab href={value} key={name} value={value}>
              {translatedName}
            </Tab>
          );
        })}
      </Tabs>
      <Routes>
        <Route
          element={
            <TabContent
              key={prefix}
              {...blockListProps}
              blocks={tab.blocks}
              name={translatedSubPageName}
              page={page}
              prefix={`${prefix}.tabs.${tabIndex}.blocks`}
              prefixIndex={`${prefixIndex}.tabs.${tabIndex}.blocks`}
            />
          }
          path={String((page.parameters || []).map((param) => `/:${param}`))}
        />
      </Routes>
    </>
  );
}
