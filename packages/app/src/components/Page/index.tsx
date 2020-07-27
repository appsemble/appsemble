import { Button, Content, Message, useLocationString } from '@appsemble/react-components';
import type { PageDefinition } from '@appsemble/types';
import { checkAppRole, normalize } from '@appsemble/utils';
import { EventEmitter } from 'events';
import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import type { ShowDialogParams } from '../../types';
import settings from '../../utils/settings';
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
  const redirect = useLocationString();
  const { isLoggedIn, role } = useUser();
  const {
    params: { lang, pageId },
    path,
    url,
  } = useRouteMatch<{ lang: string; pageId: string }>();

  const [dialog, setDialog] = useState<ShowDialogParams>();

  const ee = useRef<EventEmitter>();
  if (!ee.current) {
    ee.current = new EventEmitter();
  }

  const index = definition.pages.findIndex((p) => normalize(p.name) === pageId);
  const page = index === -1 ? null : definition.pages[index];
  const prefix = index === -1 ? null : `pages.${index}`;

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

  const checkPagePermissions = (p: PageDefinition): boolean => {
    const roles = p.roles || definition.roles || [];
    return roles.length === 0 || roles.some((r) => checkAppRole(definition.security, r, role));
  };

  // If the user is on an existing page and is allowed to view it, render it.
  if (page && checkPagePermissions(page)) {
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

  // If the user isn’t allowed to view the page, because they aren’t logged in, redirect to the
  // login page.
  if (!isLoggedIn) {
    return <Redirect to={`/${lang}/Login?${new URLSearchParams({ redirect })}`} />;
  }

  // If the user is logged in, but isn’t allowed to view the current page, redirect to the default
  // page.
  const defaultPage = definition.pages.find((p) => p.name === definition.defaultPage);
  if (checkPagePermissions(defaultPage)) {
    return <Redirect to={`/${lang}/${normalize(defaultPage.name)}`} />;
  }

  // If the user isn’t allowed to view the default page either, find a page to redirect the user to.
  const redirectPage = definition.pages.find(checkPagePermissions);
  if (redirectPage) {
    return <Redirect to={`/${lang}/${normalize(redirectPage.name)}`} />;
  }

  // If the user isn’t allowed to view any pages, show an error message.
  return (
    <Content padding>
      <Message color="danger">
        <p>
          <FormattedMessage
            {...messages.permissionError}
            values={{
              a: (text: string) => (
                <a
                  href={`${settings.apiUrl}/apps/${settings.id}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
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
