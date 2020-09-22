import type { EventEmitter } from 'events';

import { useMessages } from '@appsemble/react-components';
import type { BootstrapParams } from '@appsemble/sdk';
import type { AppDefinition, FlowPageDefinition, Remapper } from '@appsemble/types';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import type { ShowDialogAction } from '../../types';
import { makeActions } from '../../utils/makeActions';
import { BlockList } from '../BlockList';
import { DotProgressBar } from '../DotProgressBar';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider';

interface FlowPageProps {
  definition: AppDefinition;
  ee: EventEmitter;
  page: FlowPageDefinition;
  prefix: string;
  remap: (remapper: Remapper, data: any, context?: { [key: string]: any }) => any;
  showDialog: ShowDialogAction;
}

export function FlowPage({
  definition,
  ee,
  page,
  prefix,
  remap,
  showDialog,
}: FlowPageProps): ReactElement {
  const history = useHistory();
  const route = useRouteMatch<{ lang: string }>();
  const [currentPage, setCurrentPage] = useState(0);
  const [data, setData] = useState({});
  const pushNotifications = useServiceWorkerRegistration();
  const showMessage = useMessages();

  // XXX Something weird is going on here.
  // eslint-disable-next-line prefer-const
  let actions: BootstrapParams['actions'];

  const finish = useCallback(
    async (d: any): Promise<any> => {
      await actions.onFlowFinish.dispatch(d);
      setData(d);
      return d;
    },
    [actions],
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
    [currentPage, finish, page],
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
    [currentPage],
  );

  const cancel = useCallback(
    async (d: any): Promise<void> => {
      await actions.onFlowCancel.dispatch(d);
      setData(d);
    },
    [actions],
  );

  const flowActions = useMemo(
    () => ({
      next,
      finish,
      back,
      cancel,
    }),
    [back, cancel, finish, next],
  );

  actions = useMemo(
    () =>
      makeActions({
        actions: { onFlowFinish: {}, onFlowCancel: {} },
        definition,
        context: page,
        history,
        showDialog,
        extraCreators: {},
        flowActions,
        prefix,
        pushNotifications,
        ee,
        pageReady: null,
        remap,
        route,
        showMessage,
      }),
    [
      definition,
      ee,
      flowActions,
      history,
      page,
      prefix,
      pushNotifications,
      remap,
      route,
      showDialog,
      showMessage,
    ],
  );

  return (
    <>
      <DotProgressBar active={currentPage} amount={page.subPages.length} />
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
        transitions
      />
    </>
  );
}
