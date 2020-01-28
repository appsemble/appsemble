import { Loader } from '@appsemble/react-components';
import useMessages from '@appsemble/react-components/hooks/useMessages';
import {
  ActionDefinition,
  AppDefinition,
  Block,
  DialogActionDefinition,
  Page as PageType,
} from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import EventEmitter from 'events';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { ShowDialogParams, User } from '../../types';
import checkAppRole from '../../utils/checkAppRole';
import BlockList from '../BlockList';
import FlowPage from '../FlowPage';
import Login from '../Login';
import PageDialog from '../PageDialog';
import TabsPage from '../TabsPage';
import TitleBar from '../TitleBar';
import messages from './messages';
import styles from './Page.css';

interface PageProps {
  definition: AppDefinition;
  role: string;
  getBlockDefs: (blocks: Block[]) => void;
  hasErrors: boolean;
  pending: boolean;
  page: PageType;
  user: User;
  logout: () => void;
}

export default function Page({
  definition,
  role,
  getBlockDefs,
  hasErrors,
  pending,
  page,
  user,
  logout,
}: PageProps): React.ReactElement {
  const history = useHistory();
  const intl = useIntl();
  const push = useMessages();

  const [dialog, setDialog] = React.useState<ShowDialogParams>();
  const [blocks, setBlocks] = React.useState<Block[]>([]);
  const [counter, setCounter] = React.useState(0);

  const ee = React.useRef<EventEmitter>();

  const createBulmaQueryString = React.useCallback(() => {
    const params = { ...definition.theme, ...page.theme };
    const queryStringParams = new URLSearchParams(params);
    queryStringParams.sort();

    return queryStringParams.toString();
  }, [definition, page.theme]);

  const applyBulmaThemes = React.useCallback(
    (d: AppDefinition, p: PageType) => {
      const bulmaStyle = document.getElementById('bulma-style-app') as HTMLLinkElement;
      const [bulmaUrl] = bulmaStyle.href.split('?');
      bulmaStyle.href = d.theme || p.theme ? `${bulmaUrl}?${createBulmaQueryString()}` : bulmaUrl;
    },
    [createBulmaQueryString],
  );

  const checkPagePermissions = React.useCallback(
    (p: PageType): boolean => {
      const roles = p.roles || definition.roles || [];
      return roles.length === 0 || roles.some(r => checkAppRole(definition.security, r, role));
    },
    [definition.roles, definition.security, role],
  );

  const handlePagePermissions = React.useCallback((): void => {
    const permission = checkPagePermissions(page);
    if (!permission) {
      const defaultPagePermission = checkPagePermissions(
        definition.pages.find(p => p.name === definition.defaultPage),
      );

      if (defaultPagePermission) {
        history.replace('/');
      } else {
        const redirectPage = definition.pages.find(
          p => p.parameters === undefined && checkPagePermissions(p),
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
        ? page.subPages.map(f => f.blocks).flat()
        : []),
      ...(!page.type || page.type === 'page' ? page.blocks : []),
    ]);
  }, [page]);

  React.useEffect(() => {
    applyBulmaThemes(definition, page);
    ee.current = new EventEmitter();

    const actionBlocks = blocks
      .filter(block => block.actions)
      .map(block =>
        Object.values<ActionDefinition>(block.actions)
          .filter(action => action.type === 'dialog')
          .map((action: DialogActionDefinition) => action.blocks),
      )
      .flat(2);

    getBlockDefs([...new Set([...blocks, ...actionBlocks])]);

    return () => {
      if (ee.current) {
        ee.current.removeAllListeners();
        ee.current = null;
      }
    };
  }, [applyBulmaThemes, blocks, definition, getBlockDefs, page]);

  const { type } = page;

  if (definition.security && !(page.roles && page.roles.length === 0)) {
    if (!user) {
      return (
        <>
          <TitleBar>{page.name}</TitleBar>
          <Login />
        </>
      );
    }

    handlePagePermissions();
  }

  if (hasErrors) {
    return (
      <p className={styles.error}>
        <FormattedMessage {...messages.error} />
      </p>
    );
  }

  if (pending) {
    return <Loader />;
  }

  let component;
  switch (type) {
    case 'flow':
      component = (
        <FlowPage
          blocks={blocks}
          counter={counter}
          definition={definition}
          ee={ee.current}
          page={page}
          showDialog={showDialog}
        />
      );
      break;
    case 'tabs':
      component = (
        <TabsPage
          counter={counter}
          ee={ee.current}
          showDialog={showDialog}
          subPages={page.subPages}
        />
      );
      break;
    default:
      component = (
        <BlockList blocks={page.blocks} counter={counter} ee={ee.current} showDialog={showDialog} />
      );
  }

  return (
    <>
      <TitleBar>{page.name}</TitleBar>
      {component}
      <PageDialog dialog={dialog} ee={ee.current} />
    </>
  );
}
