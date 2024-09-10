import { type OpenAPIV3 } from 'openapi-types';

import { paths as authorizationsPaths } from './authorizations/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...authorizationsPaths,
};
