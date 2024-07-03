import { type OpenAPIV3 } from 'openapi-types';

import { paths as resourceTypePaths } from './resourceType/index.js';
import { paths as subscriptionsPaths } from './subscriptions/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...subscriptionsPaths,
  ...resourceTypePaths,
};
