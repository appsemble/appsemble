import normalize from '@appsemble/utils/normalize';

import {
  mapData,
} from './remapObject';


const actionCreators = {
  log(definition) {
    const {
      level = 'info',
    } = definition;

    return {
      dispatch(...args) {
        // eslint-disable-next-line no-console
        console[level](...args);
      },
      level,
    };
  },

  link(definition, block, history) {
    const href = `/${normalize(definition.to)}`;

    return {
      dispatch() {
        history.push(href);
      },
      href,
    };
  },

  noop() {
    return {
      dispatch() {},
    };
  },
};


export default function makeActions(blockDef, block, history) {
  return Object.entries(blockDef.actions || {})
    .reduce((acc, [on, { required }]) => {
      let definition;
      let type;
      if (!block.actions || !Object.hasOwnProperty.call(block.actions, on)) {
        if (required) {
          throw new Error(`Missing required action ${on}`);
        }
        type = 'noop';
      } else {
        definition = block.actions[on];
        ({ type } = definition);
      }
      const actionCreator = actionCreators[type];
      const action = actionCreator(definition, block, history);
      if (definition && Object.hasOwnProperty.call(definition, 'remap')) {
        const { dispatch } = action;
        action.dispatch = args => dispatch(mapData(definition.remap, args));
      }
      action.type = type;
      acc[on] = action;
      return acc;
    }, {});
}
