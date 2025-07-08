import { type EventEmitter } from 'events';

import {
  ActionError,
  type BlockDefinition,
  type PageDefinition,
  type Remapper,
} from '@appsemble/lang-sdk';
import { Loader, useLocationString, useMessages } from '@appsemble/react-components';
import { type ProjectImplementations } from '@appsemble/types';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';

import { type ShowDialogAction, type ShowShareDialog } from '../../types.js';
import { type ActionCreators } from '../../utils/actions/index.js';
import { checkBlockPermissions } from '../../utils/authorization.js';
import { callController } from '../../utils/bootstrapper.js';
import { createEvents } from '../../utils/events.js';
import { makeActions } from '../../utils/makeActions.js';
import { appControllerCode, appControllerImplementations } from '../../utils/settings.js';
import { type AppStorage } from '../../utils/storage.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { Block } from '../Block/index.js';
import { useDemoAppMembers } from '../DemoAppMembersProvider/index.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';

interface BlockListProps {
  readonly blocks: BlockDefinition[];
  readonly data?: any;
  readonly ee: EventEmitter;
  readonly extraCreators?: ActionCreators;
  readonly flowActions?: {};
  readonly pageDefinition: PageDefinition;
  readonly prefix: string;
  readonly prefixIndex: string;
  readonly appStorage: AppStorage;
  readonly remap: (remapper: Remapper, data: any, context: Record<string, any>) => any;
  readonly showDialog: ShowDialogAction;
  readonly showShareDialog: ShowShareDialog;
}

export function BlockList({
  appStorage,
  blocks,
  data,
  ee,
  extraCreators,
  flowActions,
  pageDefinition,
  prefix,
  prefixIndex,
  remap,
  showDialog,
  showShareDialog,
}: BlockListProps): ReactNode {
  const params = useParams();
  const location = useLocation();
  const push = useMessages();
  const { definition: appDefinition, revision } = useAppDefinition();
  const {
    addAppMemberGroup,
    appMemberGroups,
    appMemberInfoRef,
    appMemberRole,
    appMemberSelectedGroup,
    isLoggedIn,
    logout,
    passwordLogin,
    setAppMemberInfo,
  } = useAppMember();
  const { refetchDemoAppMembers } = useDemoAppMembers();
  const redirect = useLocationString();

  const cleanups = useRef<(() => void)[]>([]);
  const pushNotifications = useServiceWorkerRegistration();

  const [pageReady, setPageReady] = useState<Promise<void>>();

  const [controllerInitialized, setControllerInitialized] = useState(false);

  const blockList = useMemo(
    () =>
      blocks.map<[BlockDefinition, number, boolean]>((block, index) => [
        block,
        index,
        checkBlockPermissions(block, appDefinition, appMemberRole, appMemberSelectedGroup),
      ]),
    [blocks, appDefinition, appMemberRole, appMemberSelectedGroup],
  );

  const visibleBlocks = useMemo(() => blockList.filter(([, , visible]) => visible), [blockList]);

  const blockStatus = useRef(visibleBlocks.map(() => false));

  const [isLoading, setIsLoading] = useState(true);
  const resolvePageReady = useRef<Function>();

  const ready = useCallback(
    (block: BlockDefinition) => {
      blockStatus.current[visibleBlocks.findIndex(([b]) => b === block)] = true;
      if (blockStatus.current.every(Boolean)) {
        setIsLoading(false);
        resolvePageReady.current?.();
      }
    },
    [visibleBlocks],
  );

  useEffect(() => {
    setPageReady(
      new Promise((resolve) => {
        resolvePageReady.current = resolve;
      }),
    );
  }, [visibleBlocks]);

  useEffect(() => {
    if (!appControllerCode || !appControllerImplementations) {
      return;
    }

    if (controllerInitialized) {
      return;
    }
    setControllerInitialized(true);

    const controllerImplementations: ProjectImplementations = JSON.parse(
      appControllerImplementations as string,
    );

    if (!controllerImplementations) {
      return;
    }

    (async () => {
      await callController({
        actions: makeActions({
          appStorage,
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          actions: controllerImplementations.actions,
          appDefinition,
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          context: appDefinition.controller,
          pushNotifications,
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          pageReady,
          params,
          prefix: 'controller',
          prefixIndex: 'controller',
          ee,
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          remap,
          appMemberGroups,
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          addAppMemberGroup,
          getAppMemberInfo: () => appMemberInfoRef.current,
          passwordLogin,
          passwordLogout: logout,
          setAppMemberInfo,
          refetchDemoAppMembers,
          getAppMemberSelectedGroup: () => appMemberSelectedGroup,
        }),
        events: createEvents(
          ee,
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          pageReady,
          controllerImplementations.events,
          // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
          appDefinition.controller.events,
        ),
        data: location.state,
        utils: {
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          remap,
          addCleanup(cleanupFn) {
            cleanups.current.push(cleanupFn);
          },
          isActionError(input): input is ActionError {
            return input instanceof ActionError;
          },
        },
      });
    })();
  }, [
    appStorage,
    controllerInitialized,
    appDefinition,
    ee,
    location.state,
    logout,
    pageReady,
    params,
    passwordLogin,
    prefix,
    push,
    pushNotifications,
    refetchDemoAppMembers,
    remap,
    appMemberGroups,
    addAppMemberGroup,
    setAppMemberInfo,
    appMemberInfoRef,
    appMemberSelectedGroup,
  ]);

  if (!blockList.length) {
    if (!isLoggedIn) {
      return <Navigate to={`/Login?${new URLSearchParams({ redirect })}`} />;
    }

    return <Navigate to="/" />;
  }

  return (
    <>
      {isLoading ? <Loader /> : null}
      {blockList.map(([block, index, visible]) =>
        visible ? (
          <Block
            // As long as blocks are in a static list, using the index as a key should be fine.
            appStorage={appStorage}
            block={block}
            data={data}
            ee={ee}
            extraCreators={extraCreators}
            flowActions={flowActions}
            key={`${prefix}.${index}-${revision}`}
            pageDefinition={pageDefinition}
            // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
            pageReady={pageReady}
            prefix={`${prefix}.${index}`}
            prefixIndex={`${prefixIndex}.${index}`}
            ready={ready}
            // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
            remap={remap}
            showDialog={showDialog}
            showShareDialog={showShareDialog}
          />
        ) : null,
      )}
    </>
  );
}
