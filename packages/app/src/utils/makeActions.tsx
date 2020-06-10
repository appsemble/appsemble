import type { MessagesContext } from '@appsemble/react-components';
import type { Action } from '@appsemble/sdk';
import type {
  ActionDefinition,
  ActionType,
  AppDefinition,
  BlockDefinition,
  PageDefinition,
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
  showMessage: MessagesContext;
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
  showMessage: MessagesContext;
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
    showMessage,
  });

  const onSuccess =
    actionDefinition.onSuccess &&
    createAction({
      actionDefinition: actionDefinition.onSuccess,
      app,
      ee,
      extraCreators,
      flowActions,
      history,
      pageReady,
      prefix,
      pushNotifications,
      showDialog,
      type: actionDefinition.onSuccess.type,
      showMessage,
    });
  const onError =
    actionDefinition.onError &&
    createAction({
      actionDefinition: actionDefinition.onError,
      app,
      ee,
      extraCreators,
      flowActions,
      history,
      pageReady,
      prefix,
      pushNotifications,
      showDialog,
      type: actionDefinition.onError.type,
      showMessage,
    });

  const { dispatch } = action;
  if (actionDefinition) {
    action.dispatch = async (args: any) => {
      await pageReady;
      let result;

      try {
        result = await dispatch(
          Object.hasOwnProperty.call(actionDefinition, 'remap')
            ? remap(actionDefinition.remap, args)
            : args,
        );
      } catch (error) {
        if (onError) {
          return onError.dispatch(error);
        }

        return error;
      }

      if (onSuccess) {
        return onSuccess.dispatch(result);
      }

      return result;
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
  showMessage,
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
        showMessage,
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
          showMessage,
        });

        acc[on] = action;
        return acc;
      }, {});
  }

  return { ...anyActions, ...actionMap };
}
