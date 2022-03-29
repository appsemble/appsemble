import { EventEmitter } from 'events';

import {
  Button,
  Content,
  Message,
  MetaSwitch,
  useLocationString,
} from '@appsemble/react-components';
import { PageDefinition, Remapper } from '@appsemble/types';
import { checkAppRole, createThemeURL, mergeThemes, normalize, remap } from '@appsemble/utils';
import classNames from 'classnames';
import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, useLocation, useRouteMatch } from 'react-router-dom';

import { ShowDialogParams, ShowShareDialog } from '../../types';
import { getDefaultPageName } from '../../utils/getDefaultPageName';
import { apiUrl, appId } from '../../utils/settings';
import { useAppDefinition } from '../AppDefinitionProvider';
import { useAppMessages } from '../AppMessagesProvider';
import { BlockList } from '../BlockList';
import { FlowPage } from '../FlowPage';
import { usePage } from '../MenuProvider';
import { PageDialog } from '../PageDialog';
import { TabsPage } from '../TabsPage';
import { TitleBar } from '../TitleBar';
import { useUser } from '../UserProvider';
import styles from './index.module.css';
import { messages } from './messages';
import { ShareDialog, ShareDialogState } from './ShareDialog';

export function Page(): ReactElement {
  const { definition } = useAppDefinition();
  const redirect = useLocationString();
  const { isLoggedIn, role, teams, userInfo } = useUser();
  const {
    params: { lang, pageId },
    path,
    url,
  } = useRouteMatch<{ lang: string; pageId: string }>();
  const { pathname } = useLocation();
  const { appMessageIds, getAppMessage, getMessage } = useAppMessages();
  const { page: navPage, setPage } = usePage();

  const [data, setData] = useState<unknown>({});
  const [dialog, setDialog] = useState<ShowDialogParams>();

  const [shareDialogParams, setShareDialogParams] = useState<ShareDialogState>();
  const showShareDialog: ShowShareDialog = useCallback(
    (params) =>
      new Promise<void>((resolve, reject) => {
        setShareDialogParams({
          params,
          resolve,
          reject,
        });
      }),
    [],
  );

  const ee = useRef<EventEmitter>();
  if (!ee.current) {
    ee.current = new EventEmitter();
  }

  const normalizedPageId = normalize(pageId);
  let index = definition.pages.findIndex((p) => normalize(p.name) === normalizedPageId);

  if (index < 0) {
    const pageMessages = appMessageIds.filter((id) => id.startsWith('pages.'));
    const translatedPage = pageMessages.find(
      (id) => normalize(getAppMessage({ id }).format() as string) === normalizedPageId,
    );

    if (translatedPage) {
      index = Number(translatedPage.split('.').pop());
    }
  }

  const page = index === -1 ? null : definition.pages[index];
  const internalPageName = page ? normalize(page.name) : null;
  const prefix = index === -1 ? null : `pages.${internalPageName}`;
  const prefixIndex = index === -1 ? null : `pages.${index}`;

  const remapWithContext = useCallback(
    (mappers: Remapper, input: any, context: Record<string, any>) =>
      remap(mappers, input, {
        appId,
        url: window.location.href,
        appUrl: window.location.origin,
        getMessage,
        pageData: data,
        userInfo,
        context,
        root: input,
        locale: lang,
      }),
    [data, getMessage, lang, userInfo],
  );

  const showDialog = useCallback((d: ShowDialogParams) => {
    setDialog(d);
    return () => {
      setDialog(null);
    };
  }, []);

  useEffect(() => {
    if (!page) {
      return;
    }
    const bulmaElement = document.getElementById('bulma-style-app') as HTMLLinkElement;
    bulmaElement.href = createThemeURL(mergeThemes(definition.theme, page.theme));
  }, [definition, page]);

  // Remove the listeners from any previous pages
  useEffect(
    () => () => {
      ee.current.removeAllListeners();
    },
    [page],
  );

  const checkPagePermissions = useCallback(
    (p: PageDefinition): boolean => {
      // Users should always be able to access custom login and register pages.
      if (p.name === 'Login' || p.name === 'Register') {
        return true;
      }
      const roles = p.roles || definition.roles || [];

      return (
        roles.length === 0 || roles.some((r) => checkAppRole(definition.security, r, role, teams))
      );
    },
    [definition.roles, definition.security, role, teams],
  );

  useEffect(() => {
    if (page && checkPagePermissions(page) && navPage !== page) {
      setPage(page);
    }
  }, [checkPagePermissions, navPage, page, setPage]);

  // If the user is on an existing page and is allowed to view it, render it.
  if (page && checkPagePermissions(page)) {
    const pageName = getAppMessage({
      id: prefix,
      defaultMessage: page.name,
    }).format() as string;
    const normalizedPageName = normalize(pageName);

    if (pageId !== normalize(normalizedPageName)) {
      // Redirect to page with untranslated page name
      return <Redirect to={pathname.replace(pageId, normalizedPageName)} />;
    }

    return (
      <main
        className={classNames(styles.root, {
          [styles.hasBottomNavigation]: definition.layout?.navigation === 'bottom',
        })}
        data-path={prefix}
        data-path-index={prefixIndex}
      >
        <TitleBar>{pageName}</TitleBar>
        {page.type === 'tabs' ? (
          <TabsPage
            data={data}
            ee={ee.current}
            key={prefix}
            page={page}
            prefix={prefix}
            prefixIndex={prefixIndex}
            remap={remapWithContext}
            showDialog={showDialog}
            showShareDialog={showShareDialog}
          />
        ) : (
          // The switch is used to enforce an exact path.
          <MetaSwitch title={pageName}>
            <Route exact path={`${path}${(page.parameters || []).map((param) => `/:${param}`)}`}>
              {page.type === 'flow' ? (
                <FlowPage
                  data={data}
                  definition={definition}
                  ee={ee.current}
                  key={prefix}
                  page={page}
                  prefix={prefix}
                  prefixIndex={prefixIndex}
                  remap={remapWithContext}
                  setData={setData}
                  showDialog={showDialog}
                  showShareDialog={showShareDialog}
                />
              ) : (
                <BlockList
                  blocks={page.blocks}
                  data={data}
                  ee={ee.current}
                  key={prefix}
                  page={page}
                  prefix={`${prefix}.blocks`}
                  prefixIndex={`${prefixIndex}.blocks`}
                  remap={remapWithContext}
                  showDialog={showDialog}
                  showShareDialog={showShareDialog}
                />
              )}
            </Route>
            {/* Redirect from a matching sub URL to the actual URL */}
            {!page.parameters && <Redirect to={url} />}
          </MetaSwitch>
        )}
        <PageDialog
          dialog={dialog}
          ee={ee.current}
          page={page}
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
  if (page && !isLoggedIn) {
    return <Redirect to={`/${lang}/Login?${new URLSearchParams({ redirect })}`} />;
  }

  // If the user is logged in, but isn’t allowed to view the current page, redirect to the default
  // page.
  const defaultPageName = getDefaultPageName(isLoggedIn, role, definition);
  const defaultPage = definition.pages.find((p) => p.name === defaultPageName);
  if (checkPagePermissions(defaultPage)) {
    let pageName = defaultPage.name;

    if (appMessageIds.includes(prefix)) {
      pageName = getAppMessage({ id: prefix }).format() as string;
    }

    return <Redirect to={`/${lang}/${normalize(pageName)}`} />;
  }

  // If the user isn’t allowed to view the default page either, find a page to redirect the user to.
  const redirectPage = definition.pages.find((p) => checkPagePermissions(p) && !p.parameters);
  if (redirectPage) {
    let pageName = redirectPage.name;

    if (appMessageIds.includes(`pages.${internalPageName}`)) {
      if (appMessageIds.includes(prefix)) {
        pageName = getAppMessage({ id: prefix }).format() as string;
      }

      return <Redirect to={`/${lang}/${normalize(pageName)}`} />;
    }

    // If the user isn’t allowed to view any pages, show an error message.
    return (
      <Content padding>
        <Message color="danger">
          <p>
            <FormattedMessage
              {...messages.permissionError}
              values={{
                link: (text: string) => (
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
    );
  }
}
