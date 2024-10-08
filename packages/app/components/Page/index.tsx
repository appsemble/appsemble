import { EventEmitter } from 'events';

import {
  Button,
  Content,
  Message,
  MetaSwitch,
  useLocationString,
} from '@appsemble/react-components';
import { type PageDefinition, type Remapper } from '@appsemble/types';
import { createThemeURL, mergeThemes, normalize, remap } from '@appsemble/utils';
import classNames from 'classnames';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate, Route, useLocation, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { ShareDialog, type ShareDialogState } from './ShareDialog/index.js';
import { type ShowDialogParams, type ShowShareDialog } from '../../types.js';
import { checkPagePermissions } from '../../utils/authorization.js';
import { getDefaultPageName } from '../../utils/getDefaultPageName.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { AppStorage } from '../../utils/storage.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useAppVariables } from '../AppVariablesProvider/index.js';
import { BlockList } from '../BlockList/index.js';
import { FlowPage } from '../FlowPage/index.js';
import { usePage } from '../MenuProvider/index.js';
import { PageDialog } from '../PageDialog/index.js';
import { TabsPage } from '../TabsPage/index.js';
import { AppBar } from '../TitleBar/index.js';

export function Page(): ReactNode {
  const redirect = useLocationString();
  const { definition: appDefinition } = useAppDefinition();
  const { appMemberInfoRef, appMemberRole, appMemberSelectedGroup, isLoggedIn } = useAppMember();
  const { lang, pageId } = useParams<{ lang: string; pageId: string }>();

  const { pathname } = useLocation();
  const { appMessageIds, getAppMessage, getMessage } = useAppMessages();
  const { getVariable } = useAppVariables();
  const { page: navPage, setPage } = usePage();

  const [data, setData] = useState<unknown>({});
  const [dialog, setDialog] = useState<ShowDialogParams>();
  const stepRef = useRef<unknown>();
  const tabRef = useRef<unknown>();
  const url = `/${lang}`;

  const defaultErrorPage = useCallback(
    (): ReactNode => (
      <Content padding>
        <Message color="danger">
          <p>
            <FormattedMessage
              {...messages.permissionError}
              values={{
                link: (text) => (
                  <a href={`${apiUrl}/apps/${appId}`} rel="noopener noreferrer" target="_blank">
                    {text}
                  </a>
                ),
              }}
            />
          </p>
          <Button className="mt-4" color="danger">
            <FormattedMessage {...messages.logout} />
          </Button>
        </Message>
      </Content>
    ),
    [],
  );

  const [shareDialogParams, setShareDialogParams] = useState<ShareDialogState>();
  const showShareDialog: ShowShareDialog = useCallback(
    (showShareDialogParams) =>
      new Promise<void>((resolve, reject) => {
        setShareDialogParams({
          params: showShareDialogParams,
          resolve,
          reject,
        });
      }),
    [],
  );

  const appStorage = useRef<AppStorage>();
  if (!appStorage.current) {
    appStorage.current = new AppStorage();
  }

  const ee = useRef<EventEmitter>();
  if (!ee.current) {
    // eslint-disable-next-line unicorn/prefer-event-target
    ee.current = new EventEmitter();
  }

  const normalizedPageId = normalize(pageId);
  let index = appDefinition.pages.findIndex((p) => normalize(p.name) === normalizedPageId);

  if (index < 0) {
    const pageMessages = appMessageIds.filter((id) => id.startsWith('pages.'));
    const translatedPage = pageMessages.find(
      (id) => normalize(getAppMessage({ id }).format() as string) === normalizedPageId,
    );

    if (translatedPage) {
      const pageName = translatedPage.split('.').pop();
      index = appDefinition.pages.findIndex((p) => normalize(p.name) === pageName);
    }
  }
  const findPageById = useCallback(
    (pages: PageDefinition[]): PageDefinition | null => {
      for (const internalPage of pages) {
        const normalizedName = normalize(internalPage.name);

        if (normalizedName === normalizedPageId) {
          return internalPage;
        }

        // Check for translated page name
        const pageMessages = appMessageIds.filter((id) => id.startsWith('pages.'));
        const translatedPage = pageMessages.find(
          (id) => normalize(getAppMessage({ id }).format() as string) === normalizedPageId,
        );

        if (translatedPage) {
          const pageName = translatedPage.split('.').pop();
          if (normalize(internalPage.name) === pageName) {
            return internalPage;
          }
        }

        if (internalPage.type === 'container') {
          const foundPage = findPageById(internalPage.pages);
          if (foundPage) {
            return foundPage;
          }
        }
      }

      return null;
    },
    [appMessageIds, getAppMessage, normalizedPageId],
  );

  const pageDefinition =
    index === -1 ? findPageById(appDefinition.pages) : appDefinition.pages[index];
  const internalPageName = pageDefinition ? normalize(pageDefinition.name) : null;
  const prefix = internalPageName ? `pages.${internalPageName}` : null;
  const prefixIndex = index === -1 ? null : `pages.${index}`;

  const remapWithContext = useCallback(
    (mappers: Remapper, input: any, { history = [], ...context }: Record<string, any> = {}) =>
      remap(mappers, input, {
        appId,
        url: window.location.href,
        appUrl: window.location.origin,
        getMessage,
        getVariable,
        pageData: data,
        appMemberInfo: appMemberInfoRef.current,
        context,
        history,
        root: input,
        locale: lang,
        stepRef,
        tabRef,
      }),
    [getMessage, getVariable, data, appMemberInfoRef, lang],
  );

  const showDialog = useCallback((d: ShowDialogParams) => {
    setDialog(d);
    return () => {
      setDialog(null);
    };
  }, []);

  useEffect(() => {
    if (!pageDefinition) {
      return;
    }
    const bulmaElement = document.getElementById('bulma-style-app') as HTMLLinkElement;
    bulmaElement.href = createThemeURL(mergeThemes(appDefinition.theme, pageDefinition.theme));
  }, [appDefinition, pageDefinition]);

  // Remove the listeners from any previous pages
  useEffect(
    () => () => {
      ee.current.removeAllListeners();
    },
    [pageDefinition],
  );

  const checkPagePermissionsCallback = useCallback(
    (pd: PageDefinition): boolean =>
      checkPagePermissions(pd, appDefinition, appMemberRole, appMemberSelectedGroup),
    [appDefinition, appMemberRole, appMemberSelectedGroup],
  );

  useEffect(() => {
    if (
      pageDefinition &&
      checkPagePermissionsCallback(pageDefinition) &&
      navPage !== pageDefinition
    ) {
      setPage(pageDefinition);
    }
  }, [checkPagePermissionsCallback, navPage, pageDefinition, setPage]);

  // If the user is on an existing page and is allowed to view it, render it.
  if (pageDefinition && checkPagePermissionsCallback(pageDefinition)) {
    const pageName = getAppMessage({
      id: prefix,
      defaultMessage: pageDefinition.name,
    }).format() as string;
    const normalizedPageName = normalize(pageName);

    if (pageId !== normalize(normalizedPageName)) {
      // Redirect to page with untranslated page name
      return <Navigate to={pathname.replace(pageId, normalizedPageName)} />;
    }

    return (
      <main
        className={classNames(styles.root, {
          [styles.hasBottomNavigation]: appDefinition.layout?.navigation === 'bottom',
        })}
        data-path={prefix}
        data-path-index={prefixIndex}
      >
        <AppBar hideName={pageDefinition.hideName}>{pageName}</AppBar>
        {pageDefinition.type === 'tabs' ? (
          <TabsPage
            appStorage={appStorage.current}
            data={data}
            ee={ee.current}
            key={prefix}
            pageDefinition={pageDefinition}
            prefix={prefix}
            prefixIndex={prefixIndex}
            remap={remapWithContext}
            showDialog={showDialog}
            showShareDialog={showShareDialog}
            tabRef={tabRef}
          />
        ) : (
          // The switch is used to enforce an exact path.
          <MetaSwitch title={pageName}>
            <Route
              element={
                pageDefinition.type === 'flow' || pageDefinition.type === 'loop' ? (
                  <FlowPage
                    appDefinition={appDefinition}
                    appStorage={appStorage.current}
                    data={data}
                    ee={ee.current}
                    key={prefix}
                    pageDefinition={pageDefinition}
                    prefix={prefix}
                    prefixIndex={prefixIndex}
                    remap={remapWithContext}
                    setData={setData}
                    showDialog={showDialog}
                    showShareDialog={showShareDialog}
                    stepRef={stepRef}
                  />
                ) : pageDefinition.type === 'container' ? (
                  pageDefinition.pages.some(checkPagePermissionsCallback) ? (
                    <Navigate
                      to={pathname.replace(
                        pageId,
                        normalize(pageDefinition.pages.find(checkPagePermissionsCallback).name),
                      )}
                    />
                  ) : (
                    defaultErrorPage()
                  )
                ) : (
                  <BlockList
                    appStorage={appStorage.current}
                    blocks={pageDefinition.blocks}
                    data={data}
                    ee={ee.current}
                    key={prefix}
                    pageDefinition={pageDefinition}
                    prefix={`${prefix}.blocks`}
                    prefixIndex={`${prefixIndex}.blocks`}
                    remap={remapWithContext}
                    showDialog={showDialog}
                    showShareDialog={showShareDialog}
                  />
                )
              }
              path={String((pageDefinition.parameters || []).map((param) => `/:${param}`))}
            />
          </MetaSwitch>
        )}
        <PageDialog
          appStorage={appStorage.current}
          dialog={dialog}
          ee={ee.current}
          pageDefinition={pageDefinition}
          remap={remapWithContext}
          showDialog={showDialog}
          showShareDialog={showShareDialog}
        />
        <ShareDialog
          setShareDialogParams={setShareDialogParams}
          shareDialogParams={shareDialogParams}
        />
      </main>
    );
  }

  // If the user isn’t allowed to view the page, because they aren’t logged in, redirect to the
  // login page.
  if (pageDefinition && !isLoggedIn) {
    return <Navigate to={`${url}/Login?${new URLSearchParams({ redirect })}`} />;
  }

  // If the user is logged in, but isn’t allowed to view the current page, redirect to the default
  // page.
  const defaultPageName = getDefaultPageName(isLoggedIn, appMemberRole, appDefinition);
  const defaultPage = appDefinition.pages.find((p) => p.name === defaultPageName);

  if (checkPagePermissionsCallback(defaultPage)) {
    const defaultPagePrefix = `pages.${normalize(defaultPage.name)}`;
    let pageName = defaultPage.name;

    if (appMessageIds.includes(defaultPagePrefix)) {
      pageName = getAppMessage({ id: defaultPagePrefix }).format() as string;
    }

    return <Navigate to={`${url}/${normalize(pageName)}`} />;
  }

  // If the user isn’t allowed to view the default page either, find a page to redirect the user to.
  const redirectPage = appDefinition.pages.find(
    (pd) => checkPagePermissionsCallback(pd) && !pd.parameters,
  );
  if (redirectPage) {
    const normalizedRedirectPageName = `pages.${normalize(redirectPage.name)}`;
    let pageName = redirectPage.name;

    if (appMessageIds.includes(normalizedRedirectPageName)) {
      pageName = getAppMessage({ id: normalizedRedirectPageName }).format() as string;
    }

    return <Navigate to={`${url}/${normalize(pageName)}`} />;
  }

  // If the user isn’t allowed to view any pages, show an error message.
  return defaultErrorPage();
}
