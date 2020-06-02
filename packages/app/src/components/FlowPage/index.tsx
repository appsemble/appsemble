import type { BootstrapParams } from '@appsemble/sdk';
import type { AppDefinition, FlowPageDefinition } from '@appsemble/types';
import React from 'react';
import { useHistory } from 'react-router-dom';

import makeActions from '../../utils/makeActions';
import BlockList from '../BlockList';
import DotProgressBar from '../DotProgressBar';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider';

interface FlowPageProps extends React.ComponentPropsWithoutRef<typeof BlockList> {
  definition: AppDefinition;
  page: FlowPageDefinition;
}

export default function FlowPage({
  data: inputData,
  definition,
  ee,
  page,
  prefix,
  showDialog,
}: FlowPageProps): React.ReactElement {
  const history = useHistory();
  const [currentPage, setCurrentPage] = React.useState(0);
  const [data, setData] = React.useState(inputData);
  const pushNotifications = useServiceWorkerRegistration();

  let actions: BootstrapParams['actions'];

  const finish = React.useCallback(
    async (d: any): Promise<any> => {
      await actions.onFlowFinish.dispatch(d);
      setData(d);
      return d;
    },
    [actions],
  );

  const next = React.useCallback(
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

  const back = React.useCallback(
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

  const cancel = React.useCallback(
    async (d: any): Promise<void> => {
      await actions.onFlowCancel.dispatch(d);
      setData(d);
    },
    [actions],
  );

  const flowActions = React.useMemo(
    () => ({
      next,
      finish,
      back,
      cancel,
    }),
    [back, cancel, finish, next],
  );

  actions = React.useMemo(
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
      }),
    [definition, ee, flowActions, history, page, prefix, pushNotifications, showDialog],
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
        prefix={`${prefix}.subPages`}
        showDialog={showDialog}
        transitions
      />
    </>
  );
}
