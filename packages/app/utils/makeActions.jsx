import { remapData } from '@appsemble/utils/remap';

import actionCreators from './actions';

export default function makeActions(
  blockDef,
  app,
  context,
  history,
  showDialog,
  events,
  extraCreators,
  flowActions,
) {
  return Object.entries(blockDef.actions || {}).reduce((acc, [on, { required }]) => {
    let definition;
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
    });
    const { dispatch } = action;
    if (definition && Object.hasOwnProperty.call(definition, 'remap')) {
      action.dispatch = async args => dispatch(remapData(definition.remap, args));
    } else if (dispatch.constructor.name !== 'AsyncFunction') {
      action.dipatch = async args => dispatch(args);
    }
    action.type = type;
    acc[on] = action;
    return acc;
  }, {});
}
