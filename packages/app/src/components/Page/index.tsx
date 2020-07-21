import { useLocationString, useMessages } from '@appsemble/react-components';
import type { PageDefinition } from '@appsemble/types';
import { checkAppRole, normalize } from '@appsemble/utils';
import { EventEmitter } from 'events';
import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Redirect, Route, Switch, useHistory, useRouteMatch } from 'react-router-dom';

import type { ShowDialogParams } from '../../types';
import { useAppDefinition } from '../AppDefinitionProvider';
import BlockList from '../BlockList';
import FlowPage from '../FlowPage';
import PageDialog from '../PageDialog';
import TabsPage from '../TabsPage';
import TitleBar from '../TitleBar';
import { useUser } from '../UserProvider';
import styles from './index.css';
import messages from './messages';

export default function Page(): ReactElement {
  const { definition } = useAppDefinition();
  const history = useHistory();
  const { formatMessage } = useIntl();
  const push = useMessages();
  const redirect = useLocationString();
  const { isLoggedIn, logout, role } = useUser();
  const {
    params: { pageId },
    path,
    url,
  } = useRouteMatch<{ pageId: string }>();

  const [dialog, setDialog] = useState<ShowDialogParams>();

  const ee = useRef<EventEmitter>();
  if (!ee.current) {
    ee.current = new EventEmitter();
  }

  const index = definition.pages.findIndex((p) => normalize(p.name) === pageId);
  const page = index === -1 ? null : definition.pages[index];
  const prefix = index === -1 ? null : `pages.${index}`;

  const handlePagePermissions = useCallback(() => {
    const checkPagePermissions = (p: PageDefinition): boolean => {
      const roles = p.roles || definition.roles || [];
      return roles.length === 0 || roles.some((r) => checkAppRole(definition.security, r, role));
    };

    const permission = checkPagePermissions(page);
    if (permission) {
      return;
    }

    if (!isLoggedIn) {
      history.replace(`/Login?${new URLSearchParams({ redirect })}`);
      return;
    }

    // User is logged in but doesn’t have the right permissions
    // Attempt to find a default page to redirect to
    const defaultPagePermission = checkPagePermissions(
      definition.pages.find((p) => p.name === definition.defaultPage),
    );

    if (defaultPagePermission) {
      history.replace('/');
      return;
    }

    // Redirect to the first page that doesn’t have parameters.
    const redirectPage = definition.pages.find(
      (p) => p.parameters === undefined && checkPagePermissions(p),
    );

    // Show message that explains the app is inaccessible with the current permissions.
    if (!redirectPage) {
      push({
        body: formatMessage(messages.permissionLogout),
        color: 'danger',
        dismissable: true,
      });
      logout();
    } else {
      history.replace(`/${normalize(redirectPage.name)}`);
    }
  }, [definition, formatMessage, history, isLoggedIn, logout, page, push, redirect, role]);

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
    const queryStringParams = new URLSearchParams({ ...definition.theme, ...page.theme });
    const bulmaStyle = document.getElementById('bulma-style-app') as HTMLLinkElement;
    const bulmaUrl = new URL(bulmaStyle.href);
    queryStringParams.sort();
    bulmaUrl.search = String(queryStringParams);
    bulmaStyle.href = String(bulmaUrl);
  }, [definition, page]);

  useEffect(() => {
    if (ee.current) {
      ee.current.removeAllListeners();
      ee.current = null;
      ee.current = new EventEmitter();
    }

    return () => {
      if (ee.current) {
        ee.current.removeAllListeners();
        ee.current = null;
      }
    };
  }, [page]);

  if (definition.security) {
    handlePagePermissions();
  }

  if (!page) {
    return <Redirect to={`/${normalize(definition.defaultPage)}`} />;
  }

  return (
    <main className={styles.root} data-path={prefix}>
      <TitleBar>{page.name}</TitleBar>
      {page.type === 'tabs' ? (
        <TabsPage
          ee={ee.current}
          page={page}
          prefix={prefix}
          showDialog={showDialog}
          subPages={page.subPages}
        />
      ) : (
        // The switch is used to enforce an exact path.
        <Switch>
          <Route exact path={path}>
            {page.type === 'flow' ? (
              <FlowPage
                definition={definition}
                ee={ee.current}
                page={page}
                prefix={prefix}
                showDialog={showDialog}
              />
            ) : (
              <BlockList
                blocks={page.blocks}
                ee={ee.current}
                page={page}
                prefix={`${prefix}.blocks`}
                showDialog={showDialog}
              />
            )}
          </Route>
          {/* Redirect from a matching sub URL to the actual URL */}
          <Redirect to={url} />
        </Switch>
      )}
      <PageDialog dialog={dialog} ee={ee.current} page={page} showDialog={showDialog} />
    </main>
  );
}
