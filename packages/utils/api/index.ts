import { OpenAPIV3 } from 'openapi-types';

import { components } from './components/index.js';
import { paths } from './paths/index.js';
import { tags } from './tags/index.js';

export * as schemas from './components/schemas/index.js';

interface APIParams {
  port?: number;
  host?: string;
}

export function api(
  version: string,
  { port = 9999, host = `http://localhost:${port}` }: APIParams = {},
): OpenAPIV3.Document {
  return {
    openapi: '3.0.2',
    components,
    externalDocs: {
      description: 'Appsemble developer documentation',
      url: `${host}/docs`,
    },
    info: {
      title: 'Appsemble',
      description: `Welcome to the Appsemble API.

The app studio can be found on
> ${host}

The OpenAPI explorer can be found on
> ${host}/api-explorer
`,
      license: {
        name: 'LGPL',
        url: 'https://gitlab.com/appsemble/appsemble/blob/main/LICENSE.md',
      },
      version,
    },
    paths,
    tags,
  };
}
