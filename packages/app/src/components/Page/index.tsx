import { useLocationString, useMessages } from '@appsemble/react-components';
import type { AppDefinition, PageDefinition } from '@appsemble/types';
import { checkAppRole, normalize } from '@appsemble/utils';
import { EventEmitter } from 'events';
import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import type { ShowDialogParams } from '../../types';
import { useAppDefinition } from '../AppDefinitionProvider';
import BlockList from '../BlockList';
import FlowPage from '../FlowPage';
import PageDialog from '../PageDialog';
import TabsPage from '../TabsPage';
import TitleBar from '../TitleBar';
import { useUser } from '../UserProvider';
import messages from './messages';

interface PageProps {
  page: PageDefinition;
  prefix: string;
}

export default function Page({ page, prefix }: PageProps): ReactElement {
  const { definition } = useAppDefinition();
  const history = useHistory();
  const { formatMessage } = useIntl();
  const push = useMessages();
  const redirect = useLocationString();
  const { isLoggedIn, logout, role } = useUser();

  const [dialog, setDialog] = useState<ShowDialogParams>();

  const ee = useRef<EventEmitter>();
  if (!ee.current) {
    ee.current = new EventEmitter();
  }

  const createBulmaQueryString = useCallback(() => {
    const params = { ...definition.theme, ...page.theme };
    const queryStringParams = new URLSearchParams(params);
    queryStringParams.sort();

    return queryStringParams.toString();
  }, [definition, page.theme]);

  const applyBulmaThemes = useCallback(
    (d: AppDefinition, p: PageDefinition) => {
      const bulmaStyle = document.getElementById('bulma-style-app') as HTMLLinkElement;
      const [bulmaUrl] = bulmaStyle.href.split('?');
      bulmaStyle.href = d.theme || p.theme ? `${bulmaUrl}?${createBulmaQueryString()}` : bulmaUrl;
    },
    [createBulmaQueryString],
  );

  const checkPagePermissions = useCallback(
    (p: PageDefinition): boolean => {
      const roles = p.roles || definition.roles || [];
      return roles.length === 0 || roles.some((r) => checkAppRole(definition.security, r, role));
    },
    [definition, role],
  );

  const handlePagePermissions = useCallback(() => {
    const permission = checkPagePermissions(page);
    if (!permission) {
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
      } else {
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
      }
    }
  }, [
    checkPagePermissions,
    definition,
    formatMessage,
    history,
    isLoggedIn,
    logout,
    page,
    push,
    redirect,
  ]);

  const showDialog = useCallback((d: ShowDialogParams) => {
    setDialog(d);
    return () => {
      setDialog(null);
    };
  }, []);

  useEffect(() => {
    applyBulmaThemes(definition, page);

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
  }, [applyBulmaThemes, definition, page]);

  if (definition.security) {
    handlePagePermissions();
  }

  let component;
  switch (page.type) {
    case 'flow':
      component = (
        <FlowPage
          definition={definition}
          ee={ee.current}
          page={page}
          prefix={prefix}
          showDialog={showDialog}
        />
      );
      break;
    case 'tabs':
      component = (
        <TabsPage
          ee={ee.current}
          prefix={prefix}
          showDialog={showDialog}
          subPages={page.subPages}
        />
      );
      break;
    default:
      component = (
        <BlockList
          blocks={page.blocks}
          ee={ee.current}
          prefix={`${prefix}.blocks`}
          showDialog={showDialog}
        />
      );
  }

  return (
    <>
      <TitleBar>{page.name}</TitleBar>
      {component}
      <PageDialog dialog={dialog} ee={ee.current} showDialog={showDialog} />
    </>
  );
}
