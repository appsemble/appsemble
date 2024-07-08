import { type OpenAPIV3 } from 'openapi-types';

import { paths as actionsPaths } from './actions/index.js';
import { paths as authPaths } from './auth/index.js';
import { paths as membersPaths } from './members/index.js';
import { paths as teamsPaths } from './teams/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...actionsPaths,
  ...authPaths,
  ...membersPaths,
  ...teamsPaths,
};
