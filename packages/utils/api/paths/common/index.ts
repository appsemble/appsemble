import { type OpenAPIV3 } from 'openapi-types';

import { paths as appsPaths } from './apps/index.js';
import { paths as blocksPaths } from './blocks/index.js';
import { paths as messagesPaths } from './messages/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...appsPaths,
  ...blocksPaths,
  ...messagesPaths,
};
