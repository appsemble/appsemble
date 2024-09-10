import { type OpenAPIV3 } from 'openapi-types';

import { paths as currentPaths } from './current/index.js';
import { paths as subscribedPaths } from './subscribed.js';

export const paths: OpenAPIV3.PathsObject = {
  ...currentPaths,
  ...subscribedPaths,
};
