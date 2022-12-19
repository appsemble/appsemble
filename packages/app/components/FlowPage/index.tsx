import { EventEmitter } from 'events';

import { applyRefs, Loader, useMessages, useMeta } from '@appsemble/react-components';
import { BootstrapParams } from '@appsemble/sdk';
import {
  AppDefinition,
  FlowPageDefinition,
  LoopPageDefinition,
  Remapper,
  SubPage,
} from '@appsemble/types';
import { MutableRefObject, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ShowDialogAction, ShowShareDialog } from '../../types.js';
import { makeActions } from '../../utils/makeActions.js';
import { AppStorage } from '../../utils/storage.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { BlockList } from '../BlockList/index.js';
import { DotProgressBar } from '../DotProgressBar/index.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';
import { useUser } from '../UserProvider/index.js';

interface FlowPageProps {
  data: unknown;
  definition: AppDefinition;
  ee: EventEmitter;
  page: FlowPageDefinition | LoopPageDefinition;
  appStorage: AppStorage;
  prefix: string;
  prefixIndex: string;
  remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any;
  setData: (data: unknown) => void;
  showDialog: ShowDialogAction;
  showShareDialog: ShowShareDialog;
  stepRef: MutableRefObject<unknown>;
}

export function FlowPage({
  appStorage,
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
}: FlowPageProps): ReactElement {
  const navigate = useNavigate();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const pushNotifications = useServiceWorkerRegistration();
  const showMessage = useMessages();
  const { passwordLogin, setUserInfo, teams, updateTeam, userInfoRef } = useUser();
  const { getAppMessage } = useAppMessages();
  const [steps, setSteps] = useState(page.type === 'flow' ? page.steps : undefined);
  const [error, setError] = useState(false);
  const [loopData, setLoopData] = useState<Object[]>();
  const [stepsData, setStepsData] = useState<Object[]>();
  const id = `${prefix}.steps.${currentStep}`;

  const name = getAppMessage({
    id,
    defaultMessage: steps?.[currentStep]?.name,
  }).format() as string;
  useMeta(name === `{${id}}` ? null : name);

  useEffect(() => {
    if (page.retainFlowData === false) {
      return () => {
        setData({});
        appStorage.clear();
      };
    }
  }, [page.retainFlowData, appStorage, setData]);

  // XXX Something weird is going on here.
  let actions: BootstrapParams['actions'];

  const finish = useCallback(
    async (d: any): Promise<any> => {
      if (page.type === 'loop') {
        applyRefs(null, stepRef);
        const newData = { ...loopData[currentStep], ...d };
        let stepData = stepsData;
        if (Array.isArray(stepData) && stepData.length > 0) {
          stepData.push(newData);
        } else {
          stepData = newData;
        }
        await actions.onFlowFinish(stepData);
        return stepData;
      }
      await actions.onFlowFinish(d);
      setData(d);
      return d;
    },
    [actions, currentStep, loopData, page.type, setData, stepRef, stepsData],
  );

  const next = useCallback(
    // eslint-disable-next-line require-await
    async (d: any): Promise<any> => {
      if (currentStep + 1 === steps.length) {
        return finish(d);
      }

      if (page.type === 'loop') {
        applyRefs((loopData as Record<string, any>)[currentStep + 1], stepRef);
        const newData = { ...loopData[currentStep], ...d };
        if (Array.isArray(stepsData) && stepsData.length > 0) {
          setStepsData((previous: Object[]) => [...previous, newData]);
        } else {
          setStepsData([newData]);
        }
        setCurrentStep(currentStep + 1);
      }

      setData(d);
      setCurrentStep(currentStep + 1);
      return d;
    },
    [currentStep, steps, page, stepsData, loopData, finish, stepRef, setData],
  );

  const back = useCallback(
    // eslint-disable-next-line require-await
    async (d: any): Promise<any> => {
      if (currentStep <= 0) {
        // Don't do anything if a previous page does not exist
        return d;
      }

      if (page.type === 'loop') {
        stepsData.pop();
        applyRefs((loopData as Record<string, any>)[currentStep - 1], stepRef);
      } else {
        setData(d);
      }
      setCurrentStep(currentStep - 1);
      return d;
    },
    [currentStep, page, stepsData, loopData, stepRef, setData],
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

      setCurrentStep(found);
      applyRefs((data as Record<string, any>)[found], stepRef);
      setData(d);

      return d;
    },
    [steps, setData, data, stepRef],
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
        appStorage,
        getAppMessage,
        actions: { onFlowFinish: {}, onFlowCancel: {}, onLoad: {} },
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
      appStorage,
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

  // Generate loop steps and data
  useEffect(() => {
    if (page.type === 'loop' && !steps) {
      actions
        .onLoad()
        .then((results: any) => {
          const { blocks } = page.foreach;

          function createSteps(): SubPage[] {
            const newSteps: SubPage[] = [];
            for (const resourceData of results) {
              if (resourceData) {
                const newStep: SubPage = {
                  name: 'New loop page',
                  blocks,
                };
                newSteps.push(newStep);
              }
            }
            return newSteps;
          }
          const result = createSteps();
          setSteps(result);
          applyRefs(results[0], stepRef);
          setLoopData(results);
          setStepsData([]);
        })
        .catch(() => {
          setError(true);
        });
    }
  }, [actions, page, setData, stepRef, steps]);

  if (error) {
    return <p>Error loading steps</p>;
  }

  if (!steps) {
    return <Loader />;
  }

  const { progress = 'corner-dots' } = page;

  return (
    <>
      {progress === 'corner-dots' && <DotProgressBar active={currentStep} amount={steps.length} />}
      <BlockList
        appStorage={appStorage}
        blocks={steps[currentStep].blocks}
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
