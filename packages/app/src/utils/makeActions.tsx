import type { Action } from '@appsemble/sdk';
import type {
  ActionDefinition,
  ActionType,
  AppDefinition,
  BlockDefinition,
  PageDefinition,
  RequestLikeActionDefinition,
} from '@appsemble/types';
import { remap } from '@appsemble/utils';
import type { EventEmitter } from 'events';
import type { RouteComponentProps } from 'react-router-dom';

import type { FlowActions, ServiceWorkerRegistrationContextType, ShowDialogAction } from '../types';
import actionCreators, { ActionCreator, ActionCreators } from './actions';

interface MakeActionsParams {
  actions: { [action: string]: ActionType };
  definition: AppDefinition;
  context: BlockDefinition | PageDefinition;
  history: RouteComponentProps['history'];
  showDialog: ShowDialogAction;
  extraCreators: ActionCreators;
  flowActions: FlowActions;
  pushNotifications: ServiceWorkerRegistrationContextType;
  pageReady: Promise<void>;
  prefix: string;
  ee: EventEmitter;
}

interface CreateActionParams {
  actionDefinition: ActionDefinition;
  app: AppDefinition;
  ee: EventEmitter;
  extraCreators: ActionCreators;
  flowActions: FlowActions;
  history: RouteComponentProps['history'];
  pageReady: Promise<void>;
  prefix: string;
  pushNotifications: ServiceWorkerRegistrationContextType;
  showDialog: ShowDialogAction;
  type: Action['type'];
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
  showDialog,
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
    onSuccess:
      (type === 'request' || type.startsWith('resource.')) &&
      (actionDefinition as RequestLikeActionDefinition).onSuccess &&
      (actionDefinition as RequestLikeActionDefinition).onSuccess.type &&
      actionCreators[(actionDefinition as RequestLikeActionDefinition).onSuccess.type]({
        definition: (actionDefinition as RequestLikeActionDefinition).onSuccess,
        app,
        history,
        showDialog,
        flowActions,
        prefix,
        pushNotifications,
        ee,
      }),
    onError:
      (type === 'request' || type.startsWith('resource.')) &&
      (actionDefinition as RequestLikeActionDefinition).onError &&
      (actionDefinition as RequestLikeActionDefinition).onError.type &&
      actionCreators[(actionDefinition as RequestLikeActionDefinition).onError.type]({
        definition: (actionDefinition as RequestLikeActionDefinition).onError,
        app,
        history,
        showDialog,
        ee,
        flowActions,
        prefix,
        pushNotifications,
      }),
    pushNotifications,
  });

  const { dispatch } = action;
  if (actionDefinition) {
    action.dispatch = async (args: any) => {
      await pageReady;
      return dispatch(
        Object.hasOwnProperty.call(actionDefinition, 'remap')
          ? remap(actionDefinition.remap, args)
          : args,
      );
    };
  }

  return action;
}

export default function makeActions({
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
  showDialog,
}: MakeActionsParams): { [key: string]: Action } {
  const actionMap = Object.entries(actions || {})
    .filter(([key]) => key !== '$any')
    .reduce<{ [key: string]: Action }>((acc, [on, { required }]) => {
      let actionDefinition: ActionDefinition;
      let type: Action['type'];
      if (!context.actions || !Object.hasOwnProperty.call(context.actions, on)) {
        if (required) {
          throw new Error(`Missing required action ${on}`);
        }
        type = 'noop';
      } else {
        actionDefinition = context.actions[on];
        ({ type } = actionDefinition);
      }

      const action = createAction({
        app: definition,
        actionDefinition,
        ee,
        extraCreators,
        history,
        type,
        prefix: `${prefix}.actions.${on}`,
        pushNotifications,
        flowActions,
        showDialog,
        pageReady,
      });

      acc[on] = action;
      return acc;
    }, {});

  let anyActions: {
    [key: string]: Action;
  };
  if (actions?.$any) {
    anyActions = Object.keys(context.actions || {})
      .filter((key) => !actionMap[key])
      .reduce<{ [key: string]: Action }>((acc, on) => {
        const actionDefinition = context.actions[on];
        const { type } = actionDefinition;

        const action = createAction({
          app: definition,
          actionDefinition,
          ee,
          extraCreators,
          history,
          type,
          prefix: `${prefix}.actions.${on}`,
          pushNotifications,
          flowActions,
          showDialog,
          pageReady,
        });

        acc[on] = action;
        return acc;
      }, {});
  }

  return { ...anyActions, ...actionMap };
}
