import normalize from '@appsemble/utils/normalize';
import {
  compileFilters,
  remapData,
} from '@appsemble/utils/remap';
import axios from 'axios';

import mapValues from './mapValues';


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

  link({ to, parameters = {} }, { pages }, block, history) {
    const toPage = pages.find(({ name }) => name === to);
    if (toPage == null) {
      throw new Error(`Invalid link reference ${to}`);
    }

    const mappers = mapValues(parameters || {}, compileFilters);

    function href(data = {}) {
      return `/${[
        normalize(to),
        ...(toPage.parameters || []).map(name => (Object.hasOwnProperty.call(mappers, name) ? (
          mappers[name](data)
        ) : (
          data[name]
        ))),
      ].join('/')}`;
    }

    return {
      dispatch(data) {
        history.push(href(data));
      },
      href,
    };
  },

  noop() {
    return {
      dispatch() {},
    };
  },

  request({ method, url }) {
    return {
      dispatch(data) {
        return axios({ method, url, data });
      },
      method,
      url,
    };
  },
};


export default function makeActions(blockDef, app, block, history) {
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
      const action = actionCreator(definition, app, block, history);
      if (definition && Object.hasOwnProperty.call(definition, 'remap')) {
        const { dispatch } = action;
        action.dispatch = args => dispatch(remapData(definition.remap, args));
      }
      action.type = type;
      acc[on] = action;
      return acc;
    }, {});
}
