import { EventEmitter } from 'events';

import { useMessages, useMeta } from '@appsemble/react-components';
import { BootstrapParams } from '@appsemble/sdk';
import { AppDefinition, FlowPageDefinition, Remapper } from '@appsemble/types';
import { ReactElement, useCallback, useMemo, useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { ShowDialogAction, ShowShareDialog } from '../../types';
import { makeActions } from '../../utils/makeActions';
import { useAppMessages } from '../AppMessagesProvider';
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
  prefixIndex: string;
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
  prefixIndex,
  remap,
  setData,
  showDialog,
  showShareDialog,
}: FlowPageProps): ReactElement {
  const history = useHistory();
  const route = useRouteMatch<{ lang: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const pushNotifications = useServiceWorkerRegistration();
  const showMessage = useMessages();
  const { passwordLogin, setUserInfo, teams, updateTeam, userInfoRef } = useUser();
  const { getAppMessage } = useAppMessages();
  const step = page.steps[currentStep];
  const id = `${prefix}.steps.${currentStep}`;
  const name = getAppMessage({
    id,
    defaultMessage: step.name,
  }).format() as string;
  useMeta(name === `{${id}}` ? null : name);

  // XXX Something weird is going on here.
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
      const { steps } = page;

      if (currentStep + 1 === steps.length) {
        return finish(d);
      }

      setData(d);
      setCurrentStep(currentStep + 1);

      return d;
    },
    [currentStep, finish, page, setData],
  );

  const back = useCallback(
    // eslint-disable-next-line require-await
    async (d: any): Promise<any> => {
      if (currentStep <= 0) {
        // Don't do anything if a previous page does not exist
        return d;
      }

      setData(d);
      setCurrentStep(currentStep - 1);

      return d;
    },
    [currentStep, setData],
  );

  const cancel = useCallback(
    async (d: any): Promise<void> => {
      await actions.onFlowCancel(d);
      setData(d);
    },
    [actions, setData],
  );

  const to = useCallback(
    (d: any, stepName: string) => {
      if (typeof stepName !== 'string') {
        throw new TypeError(`Expected page to be a string, got: ${JSON.stringify(stepName)}`);
      }
      const found = page.steps.findIndex((p) => p.name === stepName);
      if (found === -1) {
        throw new Error(`No matching page was found for ${stepName}`);
      }

      setData(d);
      setCurrentStep(found);

      return d;
    },
    [page, setData],
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
        prefixIndex,
        pushNotifications,
        ee,
        pageReady: null,
        remap,
        route,
        showMessage,
        teams,
        updateTeam,
        getUserInfo: () => userInfoRef.current,
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
      prefixIndex,
      pushNotifications,
      ee,
      remap,
      route,
      showMessage,
      teams,
      updateTeam,
      passwordLogin,
      setUserInfo,
      userInfoRef,
    ],
  );

  const { progress = 'corner-dots' } = page;

  return (
    <>
      {progress === 'corner-dots' && (
        <DotProgressBar active={currentStep} amount={page.steps.length} />
      )}
      <BlockList
        blocks={step.blocks}
        data={data}
        ee={ee}
        flowActions={flowActions}
        key={currentStep}
        page={page}
        prefix={`${prefix}.steps.${currentStep}.blocks`}
        prefixIndex={`${prefixIndex}.steps.${currentStep}.blocks`}
        remap={remap}
        showDialog={showDialog}
        showShareDialog={showShareDialog}
      />
    </>
  );
}
