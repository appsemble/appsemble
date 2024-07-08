import { type OpenAPIV3 } from 'openapi-types';

import { paths as blockVersionPaths } from './blockVersion.js';
import { paths as listPaths } from './list.js';

export const paths: OpenAPIV3.PathsObject = {
  ...listPaths,
  ...blockVersionPaths,
};
