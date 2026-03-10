import {
  normalize,
  type PageDefinition,
  type RemapperContext,
  type SubPageDefinition,
  type TabsPageDefinition,
} from '@appsemble/lang-sdk';
import { applyRefs, MetaSwitch, Tab, Tabs } from '@appsemble/react-components';
import {
  type ComponentPropsWithoutRef,
  type MutableRefObject,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Navigate, Route, useLocation, useNavigate, useParams } from 'react-router-dom';

import { TabContent } from './TabContent/index.js';
import { checkPagePermissions } from '../../utils/authorization.js';
import { createEvents } from '../../utils/events.js';
import { appId } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useAppVariables } from '../AppVariablesProvider/index.js';
import { type BlockList } from '../BlockList/index.js';

interface TabsPageProps extends Omit<ComponentPropsWithoutRef<typeof BlockList>, 'blocks'> {
  readonly pageDefinition: TabsPageDefinition;
  readonly tabRef: MutableRefObject<unknown>;
}

export function TabsPage({
  appStorage,
  ee,
  pageDefinition,
  prefix,
  prefixIndex,
  remap,
  showDialog,
  showShareDialog,
  tabRef,
  ...blockListProps
}: TabsPageProps): ReactNode {
  const { definition: appDefinition, pageManifests } = useAppDefinition();
  const {
    '*': wildcard,
    lang,
    pageId,
  } = useParams<{ lang: string; pageId: string; '*': string }>();

  const { getAppMessage, getMessage } = useAppMessages();
  const [data, setData] = useState<unknown>({});
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { appMemberInfo, appMemberRole, appMemberSelectedGroup } = useAppMember();
  const [tabsWithPermissions, setTabsWithPermissions] = useState<SubPageDefinition[]>([]);
  const [defaultTab, setDefaultTab] = useState<{ id: string; name: string } | null>(null);
  const { getVariable } = useAppVariables();
  const [pageReady, setPageReady] = useState<Promise<void>>();
  const [createdTabs, setCreatedTabs] = useState<SubPageDefinition[]>([]);

  const remapperContext = useMemo(
    () =>
      ({
        appId,
        appUrl: window.location.origin,
        url: window.location.href,
        getMessage,
        getVariable,
        group: appMemberSelectedGroup,
        appMemberInfo,
        context: { name: pageDefinition.name },
        locale: lang,
      }) as RemapperContext,
    [appMemberInfo, appMemberSelectedGroup, getMessage, getVariable, lang, pageDefinition.name],
  );

  const checkSubPagePermissions = useCallback(
    (subPage: SubPageDefinition): boolean => {
      const pd: PageDefinition = {
        name: remap(subPage.name, data, remapperContext) as string,
        type: undefined,
        roles: subPage.roles,
        blocks: [],
      };

      return checkPagePermissions(pd, appDefinition, appMemberRole, appMemberSelectedGroup);
    },
    [remap, data, remapperContext, appDefinition, appMemberRole, appMemberSelectedGroup],
  );

  const events = createEvents(
    ee,
    pageReady ?? Promise.resolve(),
    pageManifests?.events,
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    pageDefinition.definition ? pageDefinition.definition.events : null,
  );
  const resolvePageReady = useRef<Function>();

  useEffect(() => {
    setPageReady(
      new Promise((resolve) => {
        resolvePageReady.current = resolve;
      }),
    );
  }, [pageDefinition.definition]);

  useEffect(() => {
    if (pageDefinition.tabs) {
      const { tabs } = pageDefinition;

      const filteredTabs = tabs.filter((tab) => checkSubPagePermissions(tab));
      setTabsWithPermissions(filteredTabs);
      const id = pageDefinition.tabs.indexOf(filteredTabs[0]);
      setDefaultTab({
        id: String(id),
        name: remap(filteredTabs[0]?.name, undefined, remapperContext),
      });
    } else if (createdTabs) {
      setTabsWithPermissions(createdTabs);
      setDefaultTab({
        id: '0',
        name: remap(createdTabs[0]?.name, undefined, remapperContext),
      });
    }
  }, [
    checkSubPagePermissions,
    pageDefinition,
    createdTabs,
    setCreatedTabs,
    remap,
    remapperContext,
  ]);

  useEffect(() => {
    const script = document.createElement('script');
    // @ts-expect-error PageEvent is not a standard event, we should find how to make typescript
    // recognize it
    script.addEventListener('PageEvent', (event: CustomEvent) => {
      event.stopImmediatePropagation();
      event.preventDefault();
    });
    const callback = (d: any): void => {
      // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
      const { blocks, name } = pageDefinition.definition.foreach;
      function createTabs(): SubPageDefinition[] {
        const newTabs: SubPageDefinition[] = [];
        for (const [i, resourceData] of d.entries()) {
          if (resourceData) {
            let remappedName: string | undefined;
            if (typeof name !== 'string') {
              remappedName = remap(name, resourceData, remapperContext);
            }
            const newTab: SubPageDefinition = {
              name: typeof name === 'string' ? `${name}${i}` : remappedName || `Generated Tab ${i}`,
              blocks,
            };
            newTabs.push(newTab);
          }
        }
        return newTabs;
      }
      const result = createTabs();
      setCreatedTabs(result);
      applyRefs(d[0], tabRef);
      setData(d);
    };

    events.on.data(callback);
    return () => events.off.data(callback) as any;
  });

  const onChange = useCallback((event: unknown, value: string) => navigate(value), [navigate]);

  const pageName = getAppMessage({
    id: prefix,
    defaultMessage: pageDefinition.name,
  }).format() as string;

  if (tabsWithPermissions.length) {
    const pageTabs = pageDefinition.tabs ?? createdTabs;
    return (
      <>
        <Tabs centered onChange={onChange} size="medium" value={pathname}>
          {pageTabs.map((tab, index) => {
            const defaultMessage = remap(tab.name, data, remapperContext);
            const translatedName = createdTabs.length
              ? defaultMessage
              : (getAppMessage({
                  id: `${prefix}.tabs.${index}`,
                  defaultMessage,
                }).format() as string);

            const value = `${['', lang, pageId, normalize(translatedName)].join('/')}${
              wildcard?.includes('/') ? wildcard.slice(wildcard.indexOf('/')) : ''
            }`;

            return checkSubPagePermissions(tab) ? (
              <Tab href={value} key={String(defaultMessage)} value={value}>
                {translatedName}
              </Tab>
            ) : null;
          })}
        </Tabs>
        <MetaSwitch title={pageName}>
          {pageTabs.map(({ blocks, layout, name, roles }, index) => {
            const defaultMessage =
              typeof name === 'string' ? name : String(remap(name, data, remapperContext));
            const translatedName = createdTabs.length
              ? defaultMessage
              : (getAppMessage({
                  id: `${prefix}.tabs.${index}`,
                  defaultMessage,
                }).format() as string);

            return (
              <Route
                element={
                  checkSubPagePermissions({ blocks, name, roles }) ? (
                    <TabContent
                      key={`${prefix}.tabs.${normalize(defaultMessage)}`}
                      {...blockListProps}
                      appStorage={appStorage}
                      blocks={blocks}
                      data={data}
                      ee={ee}
                      name={translatedName}
                      pageDefinition={pageDefinition}
                      pageLayout={layout}
                      prefix={`${prefix}.tabs.${index}.blocks`}
                      prefixIndex={`${prefixIndex}.tabs.${index}.blocks`}
                      remap={remap}
                      showDialog={showDialog}
                      showShareDialog={showShareDialog}
                      tabRef={tabRef}
                    />
                  ) : null
                }
                key={defaultMessage}
                path={`/${normalize(translatedName)}${String(
                  (pageDefinition.parameters || []).map((param) => `/:${param}`),
                )}`}
              />
            );
          })}

          <Route
            element={
              <Navigate
                to={`/${lang}/${pageId}/${normalize(
                  getAppMessage({
                    id: `${prefix}.tabs.${defaultTab?.id}`,
                    defaultMessage: defaultTab?.name,
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
}
