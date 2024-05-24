import { type EventEmitter } from 'events';

import { applyRefs, Loader, useMessages, useMeta } from '@appsemble/react-components';
import { type BootstrapParams } from '@appsemble/sdk';
import {
  type AppDefinition,
  type FlowPageDefinition,
  type LoopPageDefinition,
  type Remapper,
  type SubPage,
} from '@appsemble/types';
import {
  type MutableRefObject,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { type ShowDialogAction, type ShowShareDialog } from '../../types.js';
import { makeActions } from '../../utils/makeActions.js';
import { appId } from '../../utils/settings.js';
import { type AppStorage } from '../../utils/storage.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useAppVariables } from '../AppVariablesProvider/index.js';
import { BlockList } from '../BlockList/index.js';
import { useDemoAppMembers } from '../DemoAppMembersProvider/index.js';
import { DotProgressBar } from '../DotProgressBar/index.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';
import { useUser } from '../UserProvider/index.js';

interface FlowPageProps {
  readonly data: unknown;
  readonly definition: AppDefinition;
  readonly ee: EventEmitter;
  readonly page: FlowPageDefinition | LoopPageDefinition;
  readonly appStorage: AppStorage;
  readonly prefix: string;
  readonly prefixIndex: string;
  readonly remap: (remapper: Remapper, data: any, context?: Record<string, any>) => any;
  readonly setData: (data: unknown) => void;
  readonly showDialog: ShowDialogAction;
  readonly showShareDialog: ShowShareDialog;
  readonly stepRef: MutableRefObject<unknown>;
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
}: FlowPageProps): ReactNode {
  const navigate = useNavigate();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const pushNotifications = useServiceWorkerRegistration();
  const showMessage = useMessages();
  const { logout, passwordLogin, setUserInfo, teams, updateTeam, userInfo, userInfoRef } =
    useUser();
  const { refetchDemoAppMembers } = useDemoAppMembers();
  const { getAppMessage, getMessage } = useAppMessages();
  const { getVariable } = useAppVariables();
  const [steps, setSteps] = useState(page.type === 'flow' ? page.steps : undefined);
  const [error, setError] = useState(false);
  const [loopData, setLoopData] = useState<Object[]>();
  const [stepsData, setStepsData] = useState<Object[]>();
  const remapperContext = {
    appId,
    appUrl: window.location.origin,
    url: window.location.href,
    getMessage,
    getVariable,
    userInfo,
    appMember: userInfo?.appMember,
    context: { name: page.name },
    locale: params.lang,
  };

  const generateLoopPrefix = (loopPrefix: string): string => {
    if (!currentStep) {
      return `${loopPrefix}.steps.first`;
    }
    if (steps?.length === currentStep + 1) {
      return `${loopPrefix}.steps.last`;
    }
    return `${loopPrefix}.steps`;
  };

  const id = page.type === 'loop' ? generateLoopPrefix(prefix) : `${prefix}.steps.${currentStep}`;

  const name = getAppMessage({
    id,
    defaultMessage:
      page.type === 'loop'
        ? generateLoopPrefix(prefix)
        : typeof steps?.[currentStep]?.name === 'string'
          ? steps?.[currentStep]?.name
          : remap(steps?.[currentStep]?.name, stepsData, remapperContext),
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
        getAppVariable: getVariable,
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
        passwordLogout: logout,
        setUserInfo,
        refetchDemoAppMembers,
      }),
    [
      appStorage,
      getAppMessage,
      getVariable,
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
      logout,
      setUserInfo,
      refetchDemoAppMembers,
      userInfoRef,
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
        prefix={
          page.type === 'loop'
            ? `${generateLoopPrefix(prefix)}.blocks`
            : `${prefix}.steps.${currentStep}.blocks`
        }
        prefixIndex={
          page.type === 'loop'
            ? `${generateLoopPrefix(prefixIndex)}.blocks`
            : `${prefixIndex}.steps.${currentStep}.blocks`
        }
        remap={remap}
        showDialog={showDialog}
        showShareDialog={showShareDialog}
      />
    </>
  );
}
