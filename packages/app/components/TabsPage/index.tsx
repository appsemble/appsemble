import { MetaSwitch, Tab, Tabs, useMessages } from '@appsemble/react-components';
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
  useState,
} from 'react';
import { Navigate, Route, useLocation, useNavigate, useParams } from 'react-router-dom';

import { TabContent } from './TabContent/index.js';
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
  const { definition } = useAppDefinition();
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

  const checkSubPagePermissions = useCallback(
    (p: SubPage): boolean => {
      const roles = p.roles || definition.roles || [];

      return (
        roles.length === 0 || roles.some((r) => checkAppRole(definition.security, r, role, teams))
      );
    },
    [definition.roles, definition.security, role, teams],
  );

  useEffect(() => {
    const { tabs } = page;
    const filteredTabs = tabs.filter((tab) => checkSubPagePermissions(tab));
    setTabsWithPermissions(filteredTabs);
    const id = page.tabs.indexOf(filteredTabs[0]);
    setDefaultTab({
      id,
      name: filteredTabs[0]?.name,
    });
    actions.onLoad().then((results) => {
      setData(results);
    });
  }, [checkSubPagePermissions, page, actions]);

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
    return (
      <>
        <Tabs centered onChange={onChange} size="medium" value={pathname}>
          {page.tabs.map((tab, index) => {
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
          {page.tabs.map(({ blocks, name, roles }, index) => {
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
