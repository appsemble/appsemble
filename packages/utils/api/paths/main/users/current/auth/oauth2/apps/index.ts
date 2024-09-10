import { type OpenAPIV3 } from 'openapi-types';

import { paths as consentPaths } from './consent/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...consentPaths,
};
