import { applyRefs, MetaSwitch, Tab, Tabs, useMessages } from '@appsemble/react-components';
import { type BootstrapParams } from '@appsemble/sdk';
import { type SubPage, type TabsPageDefinition } from '@appsemble/types';
import { checkAppRole, normalize } from '@appsemble/utils';
import {
  type ChangeEvent,
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
import { createEvents } from '../../utils/events.js';
import { makeActions } from '../../utils/makeActions.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useAppVariables } from '../AppVariablesProvider/index.js';
import { type BlockList } from '../BlockList/index.js';
import { useDemoAppMembers } from '../DemoAppMembersProvider/index.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';
import { useUser } from '../UserProvider/index.js';

interface TabsPageProps extends Omit<ComponentPropsWithoutRef<typeof BlockList>, 'blocks'> {
  readonly page: TabsPageDefinition;
  readonly tabRef: MutableRefObject<unknown>;
}

export function TabsPage({
  appStorage,
  ee,
  page,
  prefix,
  prefixIndex,
  remap,
  showDialog,
  showShareDialog,
  tabRef,
  ...blockListProps
}: TabsPageProps): ReactNode {
  const { definition, pageManifests } = useAppDefinition();
  const {
    '*': wildcard,
    lang,
    pageId,
  } = useParams<{ lang: string; pageId: string; '*': string }>();

  const { getAppMessage } = useAppMessages();
  const [data, setData] = useState<unknown>({});
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, passwordLogin, role, setUserInfo, teams, updateTeam, userInfoRef } = useUser();
  const { refetchDemoAppMembers } = useDemoAppMembers();
  const [tabsWithPermissions, setTabsWithPermissions] = useState([]);
  const [defaultTab, setDefaultTab] = useState(null);
  const { getVariable } = useAppVariables();
  const pushNotifications = useServiceWorkerRegistration();
  const params = useParams();
  const showMessage = useMessages();
  let actions: BootstrapParams['actions'];
  const [pageReady, setPageReady] = useState<Promise<void>>();
  const [createdTabs, setCreatedTabs] = useState([]);

  const checkSubPagePermissions = useCallback(
    (p: SubPage): boolean => {
      const roles = p.roles || definition.roles || [];

      return (
        roles.length === 0 || roles.some((r) => checkAppRole(definition.security, r, role, teams))
      );
    },
    [definition.roles, definition.security, role, teams],
  );

  const events = createEvents(
    ee,
    pageReady,
    pageManifests.events,
    page.definition ? page.definition.events : null,
  );
  const resolvePageReady = useRef<Function>();

  useEffect(() => {
    setPageReady(
      new Promise((resolve) => {
        resolvePageReady.current = resolve;
      }),
    );
  }, [page.definition]);

  useEffect(() => {
    if (page.tabs) {
      const { tabs } = page;

      const filteredTabs = tabs.filter((tab) => checkSubPagePermissions(tab));
      setTabsWithPermissions(filteredTabs);
      const id = page.tabs.indexOf(filteredTabs[0]);
      setDefaultTab({
        id,
        name: filteredTabs[0]?.name,
      });
    } else if (createdTabs) {
      setTabsWithPermissions(createdTabs);
      setDefaultTab({
        id: '0',
        name: 'New Generated Tab 0',
      });
    }
  }, [checkSubPagePermissions, page, actions, createdTabs]);

  useEffect(() => {
    actions.onLoad().then((results) => {
      setData(results);
    });
  }, [setData, actions]);

  useEffect(() => {
    const script = document.createElement('script');
    script.addEventListener('PageEvent', (event: CustomEvent) => {
      event.stopImmediatePropagation();
      event.preventDefault();
    });
    const callback = (d: any): void => {
      const { blocks } = page.definition.foreach;
      function createTabs(): SubPage[] {
        const newTabs: SubPage[] = [];
        for (const [i, resourceData] of d.entries()) {
          if (resourceData) {
            const newTab: SubPage = {
              name: `New Generated Tab ${i}`,
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

  actions = useMemo(
    () =>
      makeActions({
        appStorage,
        getAppMessage,
        getAppVariable: getVariable,
        actions: { onLoad: {} },
        app: definition,
        context: page,
        navigate,
        extraCreators: {},
        prefix,
        prefixIndex,
        pushNotifications,
        showDialog,
        showShareDialog,
        ee,
        pageReady: null,
        remap,
        params,
        showMessage,
        teams,
        updateTeam,
        getUserInfo: () => userInfoRef.current,
        passwordLogin,
        passwordLogout: logout,
        setUserInfo,
        refetchDemoAppMembers,
      }),
    [
      appStorage,
      getAppMessage,
      getVariable,
      definition,
      page,
      navigate,
      showDialog,
      showShareDialog,
      prefix,
      prefixIndex,
      pushNotifications,
      ee,
      remap,
      params,
      showMessage,
      teams,
      updateTeam,
      passwordLogin,
      logout,
      setUserInfo,
      refetchDemoAppMembers,
      userInfoRef,
    ],
  );

  const onChange = useCallback((event: ChangeEvent, value: string) => navigate(value), [navigate]);

  const pageName = getAppMessage({ id: prefix, defaultMessage: page.name }).format() as string;

  if (tabsWithPermissions.length) {
    const pageTabs = page.tabs ?? createdTabs;
    return (
      <>
        <Tabs centered onChange={onChange} size="medium" value={pathname}>
          {pageTabs.map((tab, index) => {
            const translatedName = getAppMessage({
              id: `${prefix}.tabs.${index}`,
              defaultMessage: tab.name,
            }).format() as string;

            const value = `${['', lang, pageId, normalize(translatedName)].join('/')}${
              wildcard.includes('/') ? wildcard.slice(wildcard.indexOf('/')) : ''
            }`;

            return checkSubPagePermissions(tab) ? (
              <Tab href={value} key={tab.name} value={value}>
                {translatedName}
              </Tab>
            ) : null;
          })}
        </Tabs>
        <MetaSwitch title={pageName}>
          {pageTabs.map(({ blocks, name, roles }, index) => {
            const translatedName = getAppMessage({
              id: `${prefix}.tabs.${index}`,
              defaultMessage: name,
            }).format() as string;

            return (
              <Route
                element={
                  checkSubPagePermissions({ blocks, name, roles }) ? (
                    <TabContent
                      key={`${prefix}.tabs.${normalize(name)}`}
                      {...blockListProps}
                      appStorage={appStorage}
                      blocks={blocks}
                      data={data}
                      ee={ee}
                      name={translatedName}
                      page={page}
                      prefix={`${prefix}.tabs.${index}.blocks`}
                      prefixIndex={`${prefixIndex}.tabs.${index}.blocks`}
                      remap={remap}
                      showDialog={showDialog}
                      showShareDialog={showShareDialog}
                      tabRef={tabRef}
                    />
                  ) : null
                }
                key={name}
                path={`/${normalize(translatedName)}${String(
                  (page.parameters || []).map((param) => `/:${param}`),
                )}`}
              />
            );
          })}

          <Route
            element={
              <Navigate
                to={`/${lang}/${pageId}/${normalize(
                  getAppMessage({
                    id: `${prefix}.tabs.${defaultTab.id}`,
                    defaultMessage: defaultTab.name,
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
