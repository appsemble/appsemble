import { Action, Actions } from '@appsemble/sdk';
import {
  ActionDefinition,
  App,
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
  blockDef: BlockDefinition,
  app: App,
  context: Block<any, Record<string, ActionDefinition>> | Page,
  history: RouteComponentProps['history'],
  showDialog: ShowDialogAction,
  extraCreators: ActionCreators,
  flowActions: FlowActions,
): Actions<any> {
  return Object.entries(blockDef.actions || {}).reduce<Record<string, Action>>(
    (acc, [on, { required }]) => {
      let definition: ActionDefinition;
      let type: Action['type'];
      if (!context.actions || !Object.hasOwnProperty.call(context.actions, on)) {
        if (required) {
          throw new Error(`Missing required action ${on}`);
        }
        type = 'noop';
      } else {
        definition = context.actions[on];
        ({ type } = definition);
      }

      const actionCreator: ActionCreator = actionCreators[type] || extraCreators[type];
      const action = actionCreator({
        definition,
        app,
        history,
        showDialog,
        flowActions,
        onSuccess:
          (type === 'request' || type.startsWith('resource.')) &&
          (definition as RequestLikeActionDefinition).onSuccess &&
          (definition as RequestLikeActionDefinition).onSuccess.type &&
          actionCreators[(definition as RequestLikeActionDefinition).onSuccess.type]({
            definition: (definition as RequestLikeActionDefinition).onSuccess,
            app,
            history,
            showDialog,
            flowActions,
          }),
        onError:
          (type === 'request' || type.startsWith('resource.')) &&
          (definition as RequestLikeActionDefinition).onError &&
          (definition as RequestLikeActionDefinition).onError.type &&
          actionCreators[(definition as RequestLikeActionDefinition).onError.type]({
            definition: (definition as RequestLikeActionDefinition).onError,
            app,
            history,
            showDialog,
            flowActions,
          }),
      });
      const { dispatch } = action;
      if (definition && Object.hasOwnProperty.call(definition, 'remap')) {
        action.dispatch = async (args: any) => dispatch(remapData(definition.remap, args));
      }
      acc[on] = action;
      return acc;
    },
    {},
  );
}
