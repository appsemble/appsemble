import type { ShowMessage } from '@appsemble/react-components';
import type { Action } from '@appsemble/sdk';
import type {
  ActionDefinition,
  ActionType,
  AppDefinition,
  BlockDefinition,
  FlowPageDefinition,
  Remapper,
} from '@appsemble/types';
import type { EventEmitter } from 'events';
import type { RouteComponentProps } from 'react-router-dom';

import type { FlowActions, ServiceWorkerRegistrationContextType, ShowDialogAction } from '../types';
import actionCreators, { ActionCreator, ActionCreators } from './actions';

interface MakeActionsParams {
  actions: { [action: string]: ActionType };
  definition: AppDefinition;
  context: BlockDefinition | FlowPageDefinition;
  history: RouteComponentProps['history'];
  showDialog: ShowDialogAction;
  extraCreators: ActionCreators;
  flowActions: FlowActions;
  pushNotifications: ServiceWorkerRegistrationContextType;
  pageReady: Promise<void>;
  prefix: string;
  ee: EventEmitter;
  remap: (remapper: Remapper, data: any) => any;
  showMessage: ShowMessage;
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
  remap: (remapper: Remapper, data: any) => any;
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

        throw error;
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
  remap,
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
        actionDefinition = context.actions[on as keyof typeof context.actions];
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
        remap,
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
      .reduce<{ [key: string]: Action }>((acc, on: keyof typeof context.actions) => {
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
          remap,
          showMessage,
        });

        acc[on] = action;
        return acc;
      }, {});
  }

  return { ...anyActions, ...actionMap };
}
