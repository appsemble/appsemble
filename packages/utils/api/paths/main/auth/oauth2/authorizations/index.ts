import { type OpenAPIV3 } from 'openapi-types';

import { paths as connectPaths } from './connect.js';
import { paths as registerPaths } from './register.js';

export const paths: OpenAPIV3.PathsObject = {
  ...connectPaths,
  ...registerPaths,
};
