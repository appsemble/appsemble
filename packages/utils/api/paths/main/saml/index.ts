import { type OpenAPIV3 } from 'openapi-types';

import { paths as continuePaths } from './continue.js';

export const paths: OpenAPIV3.PathsObject = {
  ...continuePaths,
};
