import { type EventEmitter } from 'events';

import { applyRefs, Loader, useMessages, useMeta } from '@appsemble/react-components';
import { type BootstrapParams } from '@appsemble/sdk';
import {
  type AppDefinition,
  type FlowPageDefinition,
  type LoopPageDefinition,
  type Remapper,
  type SubPageDefinition,
} from '@appsemble/types';
import { type RemapperContext } from '@appsemble/utils';
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
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useAppVariables } from '../AppVariablesProvider/index.js';
import { BlockList } from '../BlockList/index.js';
import { useDemoAppMembers } from '../DemoAppMembersProvider/index.js';
import { DotProgressBar } from '../DotProgressBar/index.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';

interface FlowPageProps {
  readonly data: unknown;
  readonly appDefinition: AppDefinition;
  readonly ee: EventEmitter;
  readonly pageDefinition: FlowPageDefinition | LoopPageDefinition;
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
  appDefinition,
  appStorage,
  data,
  ee,
  pageDefinition,
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
  const {
    addAppMemberGroup,
    appMemberGroups,
    appMemberInfo,
    appMemberInfoRef,
    appMemberSelectedGroup,
    logout,
    passwordLogin,
    setAppMemberInfo,
  } = useAppMember();
  const { refetchDemoAppMembers } = useDemoAppMembers();
  const { getAppMessage, getMessage } = useAppMessages();
  const { getVariable } = useAppVariables();
  const [steps, setSteps] = useState(
    pageDefinition.type === 'flow' ? pageDefinition.steps : undefined,
  );
  const [error, setError] = useState(false);
  const [loopData, setLoopData] = useState<Object[]>();
  const [stepsData, setStepsData] = useState<Object[]>();
  const remapperContext: RemapperContext = {
    appId,
    appUrl: window.location.origin,
    url: window.location.href,
    getMessage,
    getVariable,
    appMemberInfo,
    context: { name: pageDefinition.name },
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
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

  const id =
    pageDefinition.type === 'loop' ? generateLoopPrefix(prefix) : `${prefix}.steps.${currentStep}`;

  const name = getAppMessage({
    id,
    defaultMessage:
      pageDefinition.type === 'loop'
        ? generateLoopPrefix(prefix)
        : typeof steps?.[currentStep]?.name === 'string'
          ? steps?.[currentStep]?.name
          : remap(steps?.[currentStep]?.name, stepsData, remapperContext),
  }).format() as string;
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  useMeta(name === `{${id}}` ? null : name);

  useEffect(() => {
    if (pageDefinition.retainFlowData === false) {
      return () => {
        setData({});
        appStorage.clear();
      };
    }
  }, [pageDefinition.retainFlowData, appStorage, setData]);

  // XXX Something weird is going on here.
  let actions: BootstrapParams['actions'];

  const finish = useCallback(
    async (d: any): Promise<any> => {
      if (pageDefinition.type === 'loop') {
        applyRefs(null, stepRef);
        const newData = { ...loopData?.[currentStep], ...d };
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
    // @ts-expect-error 2454 Variable 'actions' is used before being assigned (strictNullChecks)
    [actions, currentStep, loopData, pageDefinition.type, setData, stepRef, stepsData],
  );

  const next = useCallback(
    // eslint-disable-next-line require-await
    async (d: any): Promise<any> => {
      if (currentStep + 1 === steps?.length) {
        return finish(d);
      }

      if (pageDefinition.type === 'loop') {
        applyRefs((loopData as Record<string, any>)[currentStep + 1], stepRef);
        const newData = { ...loopData?.[currentStep], ...d };
        if (Array.isArray(stepsData) && stepsData.length > 0) {
          setStepsData((previous: Object[] | undefined) => [...(previous ?? []), newData]);
        } else {
          setStepsData([newData]);
        }
        setCurrentStep(currentStep + 1);
      }

      setData(d);
      setCurrentStep(currentStep + 1);
      return d;
    },
    [currentStep, steps, pageDefinition, stepsData, loopData, finish, stepRef, setData],
  );

  const back = useCallback(
    // eslint-disable-next-line require-await
    async (d: any): Promise<any> => {
      if (currentStep <= 0) {
        // Don't do anything if a previous pageDefinition does not exist
        return d;
      }

      if (pageDefinition.type === 'loop') {
        stepsData?.pop();
        applyRefs((loopData as Record<string, any>)[currentStep - 1], stepRef);
      } else {
        setData(d);
      }
      setCurrentStep(currentStep - 1);
      return d;
    },
    [currentStep, pageDefinition, stepsData, loopData, stepRef, setData],
  );

  const cancel = useCallback(
    async (d: any): Promise<void> => {
      await actions.onFlowCancel(d);
      setData(d);
    },
    // @ts-expect-error 2454 Variable 'actions' is used before being assigned (strictNullChecks)
    [actions, setData],
  );

  const to = useCallback(
    (d: any, stepName: string) => {
      if (typeof stepName !== 'string') {
        throw new TypeError(`Expected pagе to be a string, got: ${JSON.stringify(stepName)}`);
      }
      const found = steps?.findIndex((p) => p.name === stepName) ?? -1;
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
        appDefinition,
        context: pageDefinition,
        navigate,
        showDialog,
        showShareDialog,
        extraCreators: {},
        flowActions,
        prefix,
        prefixIndex,
        pushNotifications,
        ee,
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        pageReady: null,
        remap,
        params,
        showMessage,
        appMemberGroups,
        // @ts-expect-error Please Fix Me! TODO important
        addAppMemberGroup,
        getAppMemberInfo: () => appMemberInfoRef.current,
        passwordLogin,
        passwordLogout: logout,
        setAppMemberInfo,
        refetchDemoAppMembers,
        getAppMemberSelectedGroup: () => appMemberSelectedGroup,
      }),
    [
      appStorage,
      getAppMessage,
      getVariable,
      appDefinition,
      pageDefinition,
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
      appMemberGroups,
      addAppMemberGroup,
      passwordLogin,
      logout,
      setAppMemberInfo,
      refetchDemoAppMembers,
      appMemberInfoRef,
      appMemberSelectedGroup,
    ],
  );

  // Generate loop steps and data
  useEffect(() => {
    if (pageDefinition.type === 'loop' && !steps) {
      actions
        .onLoad()
        .then((results: any) => {
          const { blocks } = pageDefinition.foreach;

          function createSteps(): SubPageDefinition[] {
            const newSteps: SubPageDefinition[] = [];
            for (const resourceData of results) {
              if (resourceData) {
                const newStep: SubPageDefinition = {
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
  }, [actions, pageDefinition, setData, stepRef, steps]);

  if (error) {
    return <p>Error loading steps</p>;
  }

  if (!steps) {
    return <Loader />;
  }

  const { progress = 'corner-dots' } = pageDefinition;

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
        pageDefinition={pageDefinition}
        prefix={
          pageDefinition.type === 'loop'
            ? `${generateLoopPrefix(prefix)}.blocks`
            : `${prefix}.steps.${currentStep}.blocks`
        }
        prefixIndex={
          pageDefinition.type === 'loop'
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
