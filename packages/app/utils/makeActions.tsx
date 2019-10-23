import { Action, Actions } from '@appsemble/sdk';
import {
  ActionDefinition,
  AppDefinition,
  Block,
  BlockDefinition,
  Page,
  RequestLikeActionDefinition,
} from '@appsemble/types';
import { remapData } from '@appsemble/utils';
import { RouteComponentProps } from 'react-router-dom';

import { FlowActions, ShowDialogAction } from '../types';
import actionCreators, { ActionCreator, ActionCreators } from './actions';

export default function makeActions(
  appId: number,
  blockDef: BlockDefinition,
  definition: AppDefinition,
  context: Block<any, Record<string, ActionDefinition>> | Page,
  history: RouteComponentProps['history'],
  showDialog: ShowDialogAction,
  extraCreators: ActionCreators,
  flowActions: FlowActions,
): Actions<any> {
  return Object.entries(blockDef.actions || {}).reduce<Record<string, Action>>(
    (acc, [on, { required }]) => {
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
        appId,
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
            appId,
            definition: (actionDefinition as RequestLikeActionDefinition).onSuccess,
            app: definition,
            history,
            showDialog,
            flowActions,
          }),
        onError:
          (type === 'request' || type.startsWith('resource.')) &&
          (actionDefinition as RequestLikeActionDefinition).onError &&
          (actionDefinition as RequestLikeActionDefinition).onError.type &&
          actionCreators[(actionDefinition as RequestLikeActionDefinition).onError.type]({
            appId,
            definition: (actionDefinition as RequestLikeActionDefinition).onError,
            app: definition,
            history,
            showDialog,
            flowActions,
          }),
      });
      const { dispatch } = action;
      if (actionDefinition && Object.hasOwnProperty.call(actionDefinition, 'remap')) {
        action.dispatch = async (args: any) => dispatch(remapData(actionDefinition.remap, args));
      }
      acc[on] = action;
      return acc;
    },
    {},
  );
}
