import { type EventEmitter } from 'events';

import { Loader, useLocationString, useMessages } from '@appsemble/react-components';
import {
  ActionError,
  type BlockDefinition,
  type PageDefinition,
  type ProjectImplementations,
  type Remapper,
  type Security,
  type TeamMember,
} from '@appsemble/types';
import { checkAppRole } from '@appsemble/utils';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';

import { type ShowDialogAction, type ShowShareDialog } from '../../types.js';
import { type ActionCreators } from '../../utils/actions/index.js';
import { callController } from '../../utils/bootstrapper.js';
import { createEvents } from '../../utils/events.js';
import { makeActions } from '../../utils/makeActions.js';
import { appControllerCode, appControllerImplementations } from '../../utils/settings.js';
import { type AppStorage } from '../../utils/storage.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { Block } from '../Block/index.js';
import { useDemoAppMembers } from '../DemoAppMembersProvider/index.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';
import { useUser } from '../UserProvider/index.js';

interface BlockListProps {
  readonly blocks: BlockDefinition[];
  readonly data?: any;
  readonly ee: EventEmitter;
  readonly extraCreators?: ActionCreators;
  readonly flowActions?: {};
  readonly page: PageDefinition;
  readonly prefix: string;
  readonly prefixIndex: string;
  readonly appStorage: AppStorage;
  readonly remap: (remapper: Remapper, data: any, context: Record<string, any>) => any;
  readonly showDialog: ShowDialogAction;
  readonly showShareDialog: ShowShareDialog;
}

function filterBlocks(
  security: Security,
  blocks: BlockDefinition[],
  userRole: string,
  teams: TeamMember[],
): [BlockDefinition, number][] {
  return blocks
    .map<[BlockDefinition, number]>((block, index) => [block, index])
    .filter(
      ([block]) =>
        block.roles === undefined ||
        block.roles.length === 0 ||
        block.roles.some((r) => checkAppRole(security, r, userRole, teams)),
    );
}

export function BlockList({
  appStorage,
  blocks,
  data,
  ee,
  extraCreators,
  flowActions,
  page,
  prefix,
  prefixIndex,
  remap,
  showDialog,
  showShareDialog,
}: BlockListProps): ReactNode {
  const params = useParams();
  const location = useLocation();
  const push = useMessages();
  const { definition, revision } = useAppDefinition();
  const { isLoggedIn, logout, passwordLogin, role, setUserInfo, teams, updateTeam, userInfoRef } =
    useUser();
  const { refetchDemoAppMembers } = useDemoAppMembers();
  const redirect = useLocationString();

  const cleanups = useRef<(() => void)[]>([]);
  const pushNotifications = useServiceWorkerRegistration();

  const [pageReady, setPageReady] = useState<Promise<void>>();

  const [controllerInitialized, setControllerInitialized] = useState(false);

  const blockList = useMemo(
    () => filterBlocks(definition.security, blocks, role, teams),
    [blocks, definition, role, teams],
  );

  const blockStatus = useRef(blockList.map(() => false));

  const [isLoading, setIsLoading] = useState(true);
  const resolvePageReady = useRef<Function>();

  const ready = useCallback(
    (block: BlockDefinition) => {
      blockStatus.current[blockList.findIndex(([b]) => b === block)] = true;
      if (blockStatus.current.every(Boolean)) {
        setIsLoading(false);
        resolvePageReady.current();
      }
    },
    [blockList],
  );

  useEffect(() => {
    setPageReady(
      new Promise((resolve) => {
        resolvePageReady.current = resolve;
      }),
    );
  }, [blockList]);

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
          actions: controllerImplementations.actions,
          app: definition,
          context: definition.controller,
          pushNotifications,
          pageReady,
          params,
          prefix: 'controller',
          prefixIndex: 'controller',
          ee,
          remap,
          teams,
          updateTeam,
          getUserInfo: () => userInfoRef.current,
          passwordLogin,
          passwordLogout: logout,
          setUserInfo,
          refetchDemoAppMembers,
        }),
        events: createEvents(
          ee,
          pageReady,
          controllerImplementations.events,
          definition.controller.events,
        ),
        data: location.state,
        utils: {
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
    definition,
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
    setUserInfo,
    teams,
    updateTeam,
    userInfoRef,
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
      {blockList.map(([block, index]) => (
        <Block
          // As long as blocks are in a static list, using the index as a key should be fine.
          appStorage={appStorage}
          block={block}
          data={data}
          ee={ee}
          extraCreators={extraCreators}
          flowActions={flowActions}
          key={`${prefix}.${index}-${revision}`}
          page={page}
          pageReady={pageReady}
          prefix={`${prefix}.${index}`}
          prefixIndex={`${prefixIndex}.${index}`}
          ready={ready}
          remap={remap}
          showDialog={showDialog}
          showShareDialog={showShareDialog}
        />
      ))}
    </>
  );
}
