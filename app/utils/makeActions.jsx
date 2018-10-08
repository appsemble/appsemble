import normalize from '@appsemble/utils/normalize';
import {
  compileFilters,
  remapData,
} from '@appsemble/utils/remap';
import axios from 'axios';

import mapValues from './mapValues';
import uploadBlobs from './uploadBlobs';
import validate from './validate';


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

  request({
    blobs = {},
    method = 'GET',
    schema,
    url,
  }) {
    const regex = /{(.+?)}/g;
    const mappers = url.match(regex)
      ?.map(match => match.substring(1, match.length - 1))
      .reduce((acc, filter) => {
        acc[filter] = compileFilters(filter);
        return acc;
      }, {});

    return {
      async dispatch(data) {
        const methodUpper = method.toUpperCase();
        const request = {
          method: methodUpper,
          url: url.replace(regex, (match, filter) => mappers[filter](data)),
        };

        if (methodUpper === 'PUT' || methodUpper === 'POST' || methodUpper === 'PATCH') {
          let body;
          switch (blobs.type) {
            case 'upload': {
              body = await uploadBlobs(data, blobs);
              break;
            }
            default:
              body = data;
          }
          await validate(schema, body);
          request.data = body;
        }

        const response = await axios(request);
        return response.data;
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
