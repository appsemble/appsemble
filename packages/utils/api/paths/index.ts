import { type OpenAPIV3 } from 'openapi-types';

import { paths as appsPaths } from './apps/index.js';
import { paths as commonPaths } from './common/index.js';
import { paths as mainPaths } from './main/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...appsPaths,
  ...commonPaths,
  ...mainPaths,
};
