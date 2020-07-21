import { useMessages } from '@appsemble/react-components/src';
import type { BootstrapParams } from '@appsemble/sdk';
import type { AppDefinition, FlowPageDefinition } from '@appsemble/types';
import type { EventEmitter } from 'events';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import type { ShowDialogAction } from '../../types';
import makeActions from '../../utils/makeActions';
import BlockList from '../BlockList';
import DotProgressBar from '../DotProgressBar';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider';

interface FlowPageProps {
  definition: AppDefinition;
  ee: EventEmitter;
  page: FlowPageDefinition;
  prefix: string;
  showDialog: ShowDialogAction;
}

export default function FlowPage({
  definition,
  ee,
  page,
  prefix,
  showDialog,
}: FlowPageProps): ReactElement {
  const history = useHistory();
  const [currentPage, setCurrentPage] = useState(0);
  const [data, setData] = useState({});
  const pushNotifications = useServiceWorkerRegistration();
  const showMessage = useMessages();

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
      showDialog,
      showMessage,
    ],
  );

  return (
    <>
      <DotProgressBar active={currentPage} amount={page.subPages.length} />
      <BlockList
        key={currentPage}
        blocks={page.subPages[currentPage].blocks}
        data={data}
        ee={ee}
        flowActions={flowActions}
        page={page}
        prefix={`${prefix}.subPages.${currentPage}.blocks`}
        showDialog={showDialog}
        transitions
      />
    </>
  );
}
