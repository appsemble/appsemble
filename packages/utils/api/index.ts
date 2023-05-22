import { type OpenAPIV3 } from 'openapi-types';

import { components } from './components/index.js';
import { paths } from './paths/index.js';
import { tags } from './tags/index.js';

export * as schemas from './components/schemas/index.js';

interface APIParams {
  /**
   * The port on which the server runs.
   */
  port?: number;

  /**
   * The host on which the server is exposed.
   */
  host?: string;

  /**
   * Whether or not the API is served using SSL.
   */
  ssl?: boolean;
}

/**
 * Get the OpenAPI document for the Appsemble REST API.
 *
 * @param version The Appsemble version
 * @param argv The parsed command line arguments.
 * @returns The OpenAPI document for Appsemble.
 */
export function api(
  version: string,
  { port = 9999, ssl, host = `${ssl ? 'https' : 'http'}://localhost:${port}` }: APIParams = {},
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
