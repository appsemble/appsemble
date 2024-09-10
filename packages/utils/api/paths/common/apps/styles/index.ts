import { type OpenAPIV3 } from 'openapi-types';

import { paths as blockPaths } from './block.js';
import { paths as corePaths } from './core.js';
import { paths as sharedPaths } from './shared.js';

export const paths: OpenAPIV3.PathsObject = {
  ...blockPaths,
  ...corePaths,
  ...sharedPaths,
};
