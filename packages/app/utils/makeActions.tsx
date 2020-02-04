import { Action, Actions } from '@appsemble/sdk';
import {
  ActionDefinition,
  ActionType,
  AppDefinition,
  Block,
  Page,
  RequestLikeActionDefinition,
} from '@appsemble/types';
import { remapData } from '@appsemble/utils';
import { RouteComponentProps } from 'react-router-dom';

import { FlowActions, ServiceWorkerRegistrationContextType, ShowDialogAction } from '../types';
import actionCreators, { ActionCreator, ActionCreators } from './actions';

interface MakeActionsParams {
  actions: Record<string, ActionType>;
  definition: AppDefinition;
  context: Block<any, Record<string, ActionDefinition>> | Page;
  history: RouteComponentProps['history'];
  showDialog: ShowDialogAction;
  extraCreators: ActionCreators;
  flowActions: FlowActions;
  pushNotifications: ServiceWorkerRegistrationContextType;
}

export default function makeActions({
  actions,
  definition,
  context,
  history,
  showDialog,
  extraCreators,
  flowActions,
  pushNotifications,
}: MakeActionsParams): Actions<any> {
  return Object.entries(actions || {}).reduce<Record<string, Action>>((acc, [on, { required }]) => {
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

    const actionCreator: ActionCreator = actionCreators[type] || extraCreators[type];
    const action = actionCreator({
      definition: actionDefinition,
      app: definition,
      history,
      showDialog,
      flowActions,
      onSuccess:
        (type === 'request' || type.startsWith('resource.')) &&
        (actionDefinition as RequestLikeActionDefinition).onSuccess &&
        (actionDefinition as RequestLikeActionDefinition).onSuccess.type &&
        actionCreators[(actionDefinition as RequestLikeActionDefinition).onSuccess.type]({
          definition: (actionDefinition as RequestLikeActionDefinition).onSuccess,
          app: definition,
          history,
          showDialog,
          flowActions,
          pushNotifications,
        }),
      onError:
        (type === 'request' || type.startsWith('resource.')) &&
        (actionDefinition as RequestLikeActionDefinition).onError &&
        (actionDefinition as RequestLikeActionDefinition).onError.type &&
        actionCreators[(actionDefinition as RequestLikeActionDefinition).onError.type]({
          definition: (actionDefinition as RequestLikeActionDefinition).onError,
          app: definition,
          history,
          showDialog,
          flowActions,
          pushNotifications,
        }),
      pushNotifications,
    });
    const { dispatch } = action;
    if (actionDefinition && Object.hasOwnProperty.call(actionDefinition, 'remap')) {
      action.dispatch = async (args: any) => dispatch(remapData(actionDefinition.remap, args));
    }
    acc[on] = action;
    return acc;
  }, {});
}
