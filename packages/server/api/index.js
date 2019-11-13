import dedent from 'dedent';

import pkg from '../package.json';
import components from './components';
import paths from './paths';
import tags from './tags';

function makeJSONSafe(object) {
  if (object == null) {
    return null;
  }
  if (Array.isArray(object)) {
    return object.map(item => makeJSONSafe(item));
  }
  if (object instanceof RegExp) {
    return object.source;
  }
  if (object instanceof Object) {
    return Object.entries(object).reduce((acc, [key, value]) => {
      acc[key] = makeJSONSafe(value);
      return acc;
    }, {});
  }
  if (typeof object === 'string') {
    return dedent(object);
  }
  return object;
}

export default ({ port = 9999, host = `http://localhost:${port}` } = {}) => {
  return makeJSONSafe({
    openapi: '3.0.2',
    components,
    externalDocs: {
      description: 'Appsemble developer documentation',
      url: 'https://appsemble.dev',
    },
    info: {
      title: 'Appsemble',
      description: `
        Welcome to the Appsemble API.

        The app studio can be found on
        > ${host}

        The OpenAPI explorer can be found on
        > ${host}/api-explorer

        Rendered apps can be found on
        > ${host}/:id
      `,
      license: {
        name: 'LGPL',
        url: 'https://gitlab.com/appsemble/appsemble/blob/master/LICENSE.md',
      },
      version: pkg.version,
    },
    paths,
    tags,
  });
};
