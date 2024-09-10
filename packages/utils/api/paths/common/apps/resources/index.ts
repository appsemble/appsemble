import { type OpenAPIV3 } from 'openapi-types';

import { paths as typePaths } from './resourceType/index.js';
import { paths as subscriptionsPaths } from './subscriptions/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...subscriptionsPaths,
  ...typePaths,
};
