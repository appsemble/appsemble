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

interface CommonActionParams {
  app: AppDefinition;
  ee: EventEmitter;
  extraCreators: ActionCreators;
  flowActions: FlowActions;
  history: RouteComponentProps['history'];
  pageReady: Promise<void>;
  prefix: string;
  pushNotifications: ServiceWorkerRegistrationContextType;
  remap: (remapper: Remapper, data: any, context: Record<string, any>) => any;
  route: Match<{ lang: string }>;
  showDialog: ShowDialogAction;
  showMessage: ShowMessage;
}

interface MakeActionsParams extends CommonActionParams {
  actions: Record<string, ActionType>;
  context: BlockDefinition | FlowPageDefinition;
}

interface CreateActionParams extends CommonActionParams {
  actionDefinition: ActionDefinition;
  type: Action['type'];
}

function createAction({
  actionDefinition,
  extraCreators,
  pageReady,
  prefix,
  remap,
  type,
  ...params
}: CreateActionParams): Action {
  const actionCreator: ActionCreator = actionCreators[type] || extraCreators[type];

  const action = actionCreator({
    ...params,
    definition: actionDefinition,
    remap,
    prefix,
  });

  const onSuccess =
    actionDefinition?.onSuccess &&
    createAction({
      ...params,
      actionDefinition: actionDefinition.onSuccess,
      extraCreators,
      pageReady,
      prefix: `${prefix}.onSuccess`,
      remap,
      type: actionDefinition.onSuccess.type,
    });
  const onError =
    actionDefinition?.onError &&
    createAction({
      ...params,
      actionDefinition: actionDefinition.onError,
      extraCreators,
      pageReady,
      prefix: `${prefix}.onError`,
      remap,
      type: actionDefinition.onError.type,
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
  prefix,
  ...params
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
        ...params,
        actionDefinition,
        type,
        prefix: `${prefix}.actions.${on}`,
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
          ...params,
          actionDefinition,
          type,
          prefix: `${prefix}.actions.${on}`,
        });

        acc[on] = action;
        return acc;
      }, {});
  }

  return { ...anyActions, ...actionMap };
}
