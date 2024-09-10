import { type OpenAPIV3 } from 'openapi-types';

import { paths as emailsPaths } from './emails/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...emailsPaths,
};
