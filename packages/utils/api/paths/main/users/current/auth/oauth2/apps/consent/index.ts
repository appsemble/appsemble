import { type OpenAPIV3 } from 'openapi-types';

import { paths as agreePaths } from './agree.js';
import { paths as verifyPaths } from './verify.js';

export const paths: OpenAPIV3.PathsObject = {
  ...agreePaths,
  ...verifyPaths,
};
