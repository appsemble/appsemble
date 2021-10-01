import { EventEmitter } from 'events';

import { useMessages } from '@appsemble/react-components';
import { BootstrapParams } from '@appsemble/sdk';
import { AppDefinition, FlowPageDefinition, Remapper } from '@appsemble/types';
import { ReactElement, useCallback, useMemo, useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { ShowDialogAction, ShowShareDialog } from '../../types';
import { makeActions } from '../../utils/makeActions';
import { BlockList } from '../BlockList';
import { DotProgressBar } from '../DotProgressBar';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider';
import { useUser } from '../UserProvider';

interface FlowPageProps {
  data: unknown;
  definition: AppDefinition;
  ee: EventEmitter;
  page: FlowPageDefinition;
  prefix: string;
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any;
  setData: (data: unknown) => void;
  showDialog: ShowDialogAction;
  showShareDialog: ShowShareDialog;
}

export function FlowPage({
  data,
  definition,
  ee,
  page,
  prefix,
  remap,
  setData,
  showDialog,
  showShareDialog,
}: FlowPageProps): ReactElement {
  const history = useHistory();
  const route = useRouteMatch<{ lang: string }>();
  const [currentPage, setCurrentPage] = useState(0);
  const pushNotifications = useServiceWorkerRegistration();
  const showMessage = useMessages();
  const { passwordLogin, setUserInfo, teams, updateTeam, userInfo } = useUser();

  // XXX Something weird is going on here.
  // eslint-disable-next-line prefer-const
  let actions: BootstrapParams['actions'];

  const finish = useCallback(
    async (d: any): Promise<any> => {
      await actions.onFlowFinish(d);
      setData(d);
      return d;
    },
    [actions, setData],
  );

  const next = useCallback(
    // eslint-disable-next-line require-await
    async (d: any): Promise<any> => {
      const { subPages } = page;

      if (currentPage + 1 === subPages.length) {
        return finish(d);
      }

      setData(d);
      setCurrentPage(currentPage + 1);

      return d;
    },
    [currentPage, finish, page, setData],
  );

  const back = useCallback(
    // eslint-disable-next-line require-await
    async (d: any): Promise<any> => {
      if (currentPage <= 0) {
        // Don't do anything if a previous page does not exist
        return d;
      }

      setData(d);
      setCurrentPage(currentPage - 1);

      return d;
    },
    [currentPage, setData],
  );

  const cancel = useCallback(
    async (d: any): Promise<void> => {
      await actions.onFlowCancel(d);
      setData(d);
    },
    [actions, setData],
  );

  const to = useCallback(
    (d: any, step: string) => {
      if (typeof step !== 'string') {
        throw new TypeError(`Expected page to be a string, got: ${JSON.stringify(step)}`);
      }
      const found = page.subPages.findIndex((p) => p.name === step);
      if (found === -1) {
        throw new Error(`No matching page was found for ${step}`);
      }

      setData(d);
      setCurrentPage(found);

      return d;
    },
    [page.subPages, setData],
  );

  const flowActions = useMemo(
    () => ({
      next,
      finish,
      back,
      cancel,
      to,
    }),
    [back, cancel, finish, next, to],
  );

  actions = useMemo(
    () =>
      makeActions({
        actions: { onFlowFinish: {}, onFlowCancel: {} },
        app: definition,
        context: page,
        history,
        showDialog,
        showShareDialog,
        extraCreators: {},
        flowActions,
        prefix,
        pushNotifications,
        ee,
        pageReady: null,
        remap,
        route,
        showMessage,
        teams,
        updateTeam,
        userInfo,
        passwordLogin,
        setUserInfo,
      }),
    [
      definition,
      page,
      history,
      showDialog,
      showShareDialog,
      flowActions,
      prefix,
      pushNotifications,
      ee,
      remap,
      route,
      showMessage,
      teams,
      updateTeam,
      userInfo,
      passwordLogin,
      setUserInfo,
    ],
  );

  const { progress = 'corner-dots' } = page;

  return (
    <>
      {progress === 'corner-dots' && (
        <DotProgressBar active={currentPage} amount={page.subPages.length} />
      )}
      <BlockList
        blocks={page.subPages[currentPage].blocks}
        data={data}
        ee={ee}
        flowActions={flowActions}
        key={currentPage}
        page={page}
        prefix={`${prefix}.subPages.${currentPage}.blocks`}
        remap={remap}
        showDialog={showDialog}
        showShareDialog={showShareDialog}
      />
    </>
  );
}
