import { EventEmitter } from 'events';

import { useMessages, useMeta } from '@appsemble/react-components';
import { BootstrapParams } from '@appsemble/sdk';
import { AppDefinition, FlowPageDefinition, Remapper, SubPage } from '@appsemble/types';
import { MutableRefObject, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ShowDialogAction, ShowShareDialog } from '../../types.js';
import { makeActions } from '../../utils/makeActions.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { BlockList } from '../BlockList/index.js';
import { DotProgressBar } from '../DotProgressBar/index.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';
import { useUser } from '../UserProvider/index.js';

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
  stepRef: MutableRefObject<unknown>;
  updateStepRef: (data: unknown) => void;
  steps: SubPage[];
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
  stepRef,
  steps,
  updateStepRef,
}: FlowPageProps): ReactElement {
  const navigate = useNavigate();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const pushNotifications = useServiceWorkerRegistration();
  const showMessage = useMessages();
  const { passwordLogin, setUserInfo, teams, updateTeam, userInfoRef } = useUser();
  const { getAppMessage } = useAppMessages();
  const step = steps[currentStep];
  const id = `${prefix}.steps.${currentStep}`;

  const name = getAppMessage({
    id,
    defaultMessage: step.name,
  }).format() as string;
  useMeta(name === `{${id}}` ? null : name);

  useEffect(() => {
    if (page.retainFlowData === false) {
      return () => setData({});
    }
  }, [page.retainFlowData, setData]);

  if (!stepRef.current) {
    updateStepRef((data as Record<string, any>)[0]);
  }

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
      if (currentStep + 1 === steps.length) {
        return finish(d);
      }
      setData(d);
      setCurrentStep(currentStep + 1);
      updateStepRef((data as Record<string, any>)[currentStep + 1]);

      return d;
    },
    [currentStep, steps.length, setData, updateStepRef, data, finish],
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
      updateStepRef((data as Record<string, any>)[currentStep - 1]);

      return d;
    },
    [currentStep, setData, updateStepRef, data],
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
      const found = steps.findIndex((p) => p.name === stepName);
      if (found === -1) {
        throw new Error(`No matching page was found for ${stepName}`);
      }

      setData(d);
      setCurrentStep(found);
      updateStepRef((data as Record<string, any>)[found]);

      return d;
    },
    [steps, setData, updateStepRef, data],
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
        getAppMessage,
        actions: { onFlowFinish: {}, onFlowCancel: {} },
        app: definition,
        context: page,
        navigate,
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
        params,
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
      navigate,
      showDialog,
      showShareDialog,
      flowActions,
      prefix,
      prefixIndex,
      pushNotifications,
      ee,
      remap,
      params,
      showMessage,
      teams,
      updateTeam,
      passwordLogin,
      setUserInfo,
      userInfoRef,
      getAppMessage,
    ],
  );

  const { progress = 'corner-dots' } = page;

  return (
    <>
      {progress === 'corner-dots' && <DotProgressBar active={currentStep} amount={steps.length} />}
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
