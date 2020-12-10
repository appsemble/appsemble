import { EventEmitter } from 'events';

import { ShowMessage } from '@appsemble/react-components';
import { Action } from '@appsemble/sdk';
import {
  ActionDefinition,
  ActionType,
  AppDefinition,
  BlockDefinition,
  FlowPageDefinition,
  Remapper,
} from '@appsemble/types';
import { addBreadcrumb, Severity } from '@sentry/browser';
import { match as Match, RouteComponentProps } from 'react-router-dom';

import { FlowActions, ServiceWorkerRegistrationContextType, ShowDialogAction } from '../types';
import { ActionCreator, ActionCreators, actionCreators } from './actions';

interface MakeActionsParams {
  actions: Record<string, ActionType>;
  definition: AppDefinition;
  context: BlockDefinition | FlowPageDefinition;
  history: RouteComponentProps['history'];
  route: Match<{ lang: string }>;
  showDialog: ShowDialogAction;
  extraCreators: ActionCreators;
  flowActions: FlowActions;
  pushNotifications: ServiceWorkerRegistrationContextType;
  pageReady: Promise<void>;
  prefix: string;
  ee: EventEmitter;
  remap: (remapper: Remapper, data: any, context: Record<string, any>) => any;
  showMessage: ShowMessage;
}

interface CreateActionParams {
  actionDefinition: ActionDefinition;
  app: AppDefinition;
  ee: EventEmitter;
  extraCreators: ActionCreators;
  flowActions: FlowActions;
  history: RouteComponentProps['history'];
  route: Match<{ lang: string }>;
  pageReady: Promise<void>;
  prefix: string;
  pushNotifications: ServiceWorkerRegistrationContextType;
  remap: (remapper: Remapper, data: any, context: Record<string, any>) => any;
  showDialog: ShowDialogAction;
  type: Action['type'];
  showMessage: ShowMessage;
}

function createAction({
  actionDefinition,
  app,
  ee,
  extraCreators,
  flowActions,
  history,
  pageReady,
  prefix,
  pushNotifications,
  remap,
  route,
  showDialog,
  showMessage,
  type,
}: CreateActionParams): Action {
  const actionCreator: ActionCreator = actionCreators[type] || extraCreators[type];

  const action = actionCreator({
    definition: actionDefinition,
    app,
    history,
    showDialog,
    flowActions,
    prefix,
    ee,
    pushNotifications,
    remap,
    showMessage,
    route,
  });

  const onSuccess =
    actionDefinition?.onSuccess &&
    createAction({
      actionDefinition: actionDefinition.onSuccess,
      app,
      ee,
      extraCreators,
      flowActions,
      history,
      route,
      pageReady,
      prefix: `${prefix}.onSuccess`,
      pushNotifications,
      remap,
      showDialog,
      type: actionDefinition.onSuccess.type,
      showMessage,
    });
  const onError =
    actionDefinition?.onError &&
    createAction({
      actionDefinition: actionDefinition.onError,
      app,
      ee,
      extraCreators,
      flowActions,
      history,
      route,
      pageReady,
      prefix: `${prefix}.onError`,
      pushNotifications,
      remap,
      showDialog,
      type: actionDefinition.onError.type,
      showMessage,
    });

  const { dispatch } = action;
  if (actionDefinition) {
    action.dispatch = async (args: any, context: Record<string, any>) => {
      await pageReady;
      let result;

      try {
        result = await dispatch(
          Object.hasOwnProperty.call(actionDefinition, 'remap')
            ? remap(actionDefinition.remap, args, context)
            : args,
        );
        addBreadcrumb({
          category: 'appsemble.action',
          data: { success: action.type },
        });
      } catch (error: unknown) {
        addBreadcrumb({
          category: 'appsemble.action',
          data: { failed: action.type },
          level: Severity.Warning,
        });
        if (onError) {
          return onError.dispatch(error, context);
        }

        throw error;
      }

      if (onSuccess) {
        return onSuccess.dispatch(result, context);
      }

      return result;
    };
  }

  return action;
}

export function makeActions({
  actions,
  context,
  definition,
  ee,
  extraCreators,
  flowActions,
  history,
  pageReady,
  prefix,
  pushNotifications,
  remap,
  route,
  showDialog,
  showMessage,
}: MakeActionsParams): Record<string, Action> {
  const actionMap = Object.entries(actions || {})
    .filter(([key]) => key !== '$any')
    .reduce<Record<string, Action>>((acc, [on, { required }]) => {
      let actionDefinition: ActionDefinition;
      let type: Action['type'];
      if (!context.actions || !Object.hasOwnProperty.call(context.actions, on)) {
        if (required) {
          throw new Error(`Missing required action ${on}`);
        }
        type = 'noop';
      } else {
        actionDefinition = context.actions[on as keyof typeof context.actions];
        ({ type } = actionDefinition);
      }

      const action = createAction({
        app: definition,
        actionDefinition,
        ee,
        extraCreators,
        history,
        route,
        type,
        prefix: `${prefix}.actions.${on}`,
        pushNotifications,
        flowActions,
        showDialog,
        pageReady,
        remap,
        showMessage,
      });

      acc[on] = action;
      return acc;
    }, {});

  let anyActions: Record<string, Action>;
  if (actions?.$any) {
    anyActions = Object.keys(context.actions || {})
      .filter((key) => !actionMap[key])
      .reduce<Record<string, Action>>((acc, on: keyof typeof context.actions) => {
        const actionDefinition = context.actions[on];
        const { type } = actionDefinition;

        const action = createAction({
          app: definition,
          actionDefinition,
          ee,
          extraCreators,
          history,
          route,
          type,
          prefix: `${prefix}.actions.${on}`,
          pushNotifications,
          flowActions,
          showDialog,
          pageReady,
          remap,
          showMessage,
        });

        acc[on] = action;
        return acc;
      }, {});
  }

  return { ...anyActions, ...actionMap };
}
