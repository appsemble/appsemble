import { useMessages } from '@appsemble/react-components';
import type {
  AppDefinition,
  BasicPageDefinition,
  BlockDefinition,
  PageDefinition,
} from '@appsemble/types';
import { checkAppRole, normalize } from '@appsemble/utils';
import { EventEmitter } from 'events';
import React from 'react';
import { useIntl } from 'react-intl';
import { Redirect, useHistory, useLocation } from 'react-router-dom';

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

export default function Page({ page, prefix }: PageProps): React.ReactElement {
  const { definition } = useAppDefinition();
  const history = useHistory();
  const intl = useIntl();
  const push = useMessages();
  const location = useLocation();
  const { isLoggedIn, logout, role } = useUser();

  const [dialog, setDialog] = React.useState<ShowDialogParams>();
  const [blocks, setBlocks] = React.useState<BlockDefinition[]>([]);

  const ee = React.useRef<EventEmitter>();
  if (!ee.current) {
    ee.current = new EventEmitter();
  }

  const createBulmaQueryString = React.useCallback(() => {
    const params = { ...definition.theme, ...page.theme };
    const queryStringParams = new URLSearchParams(params);
    queryStringParams.sort();

    return queryStringParams.toString();
  }, [definition, page.theme]);

  const applyBulmaThemes = React.useCallback(
    (d: AppDefinition, p: PageDefinition) => {
      const bulmaStyle = document.getElementById('bulma-style-app') as HTMLLinkElement;
      const [bulmaUrl] = bulmaStyle.href.split('?');
      bulmaStyle.href = d.theme || p.theme ? `${bulmaUrl}?${createBulmaQueryString()}` : bulmaUrl;
    },
    [createBulmaQueryString],
  );

  const checkPagePermissions = React.useCallback(
    (p: PageDefinition): boolean => {
      const roles = p.roles || definition.roles || [];
      return roles.length === 0 || roles.some((r) => checkAppRole(definition.security, r, role));
    },
    [definition, role],
  );

  const handlePagePermissions = React.useCallback(() => {
    const permission = checkPagePermissions(page);
    if (!permission) {
      const defaultPagePermission = checkPagePermissions(
        definition.pages.find((p) => p.name === definition.defaultPage),
      );

      if (defaultPagePermission) {
        history.replace('/');
      } else {
        const redirectPage = definition.pages.find(
          (p) => p.parameters === undefined && checkPagePermissions(p),
        );

        if (!redirectPage) {
          push({
            body: intl.formatMessage(messages.permissionLogout),
            color: 'danger',
            dismissable: true,
          });
          logout();
          return;
        }

        history.replace(`/${normalize(redirectPage.name)}`);
      }
    }
  }, [checkPagePermissions, definition, history, intl, logout, page, push]);

  const showDialog = React.useCallback((d: ShowDialogParams) => {
    setDialog(d);
    return () => {
      setDialog(null);
    };
  }, []);

  React.useEffect(() => {
    setBlocks([
      ...(page.type === 'tabs' || page.type === 'flow'
        ? page.subPages.map((f) => f.blocks).flat()
        : []),
      ...(!page.type || page.type === 'page' ? (page as BasicPageDefinition).blocks : []),
    ]);
  }, [page]);

  React.useEffect(() => {
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

  if (definition.security && !(page.roles && page.roles.length === 0)) {
    if (!isLoggedIn) {
      const redirect = `${location.pathname}${location.search}${location.hash}`;
      return <Redirect to={`/Login?${new URLSearchParams({ redirect })}`} />;
    }

    handlePagePermissions();
  }

  let component;
  switch (page.type) {
    case 'flow':
      component = (
        <FlowPage
          blocks={blocks}
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
