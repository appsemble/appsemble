import { Actions, Events } from '@appsemble/sdk';
import { App, Block, BlockDefinition, Page } from '@appsemble/types';
import { remapData } from '@appsemble/utils';
import { RouteComponentProps } from 'react-router-dom';

import actionCreators from './actions';

export default function makeActions(
  blockDef: BlockDefinition,
  app: App,
  context: Page | Block,
  history: RouteComponentProps['history'],
  /**
   * XXX: Define this type
   */
  showDialog: Function,
  events: Events,
  extraCreators: any,
  flowActions: {},
): Actions<any> {
  return Object.entries(blockDef.actions || {}).reduce((acc, [on, { required }]) => {
    let definition: typeof context.actions;
    let type;
    if (!context.actions || !Object.hasOwnProperty.call(context.actions, on)) {
      if (required) {
        throw new Error(`Missing required action ${on}`);
      }
      type = 'noop';
    } else {
      definition = context.actions[on];
      ({ type } = definition);
    }

    const actionCreator = actionCreators[type] || extraCreators[type];
    const action = actionCreator({
      definition,
      app,
      context,
      history,
      showDialog,
      events,
      flowActions,
      ...((type === 'request' || type.startsWith('resource.')) &&
        definition.onSuccess &&
        definition.onSuccess.type && {
          onSuccess: actionCreators[definition.onSuccess.type]({
            definition: definition.onSuccess,
            app,
            context,
            history,
            showDialog,
            events,
            flowActions,
          }),
        }),
      ...((type === 'request' || type.startsWith('resource.')) &&
        definition.onError &&
        definition.onError.type && {
          onError: actionCreators[definition.onError.type]({
            definition: definition.onError,
            app,
            context,
            history,
            showDialog,
            events,
            flowActions,
          }),
        }),
    });
    const { dispatch } = action;
    if (definition && Object.hasOwnProperty.call(definition, 'remap')) {
      action.dispatch = async (args: any) => dispatch(remapData(definition.remap, args));
    } else if (dispatch.constructor.name !== 'AsyncFunction') {
      action.dipatch = async (args: any) => dispatch(args);
    }
    action.type = type;
    acc[on] = action;
    return acc;
  }, {});
}
