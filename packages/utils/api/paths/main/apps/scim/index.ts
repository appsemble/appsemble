import { type OpenAPIV3 } from 'openapi-types';

import { paths as resourceTypesPaths } from './resource-types/index.js';
import { paths as schemasPaths } from './schemas/index.js';
import { paths as serviceProviderConfigPaths } from './service-provider-config/index.js';
import { paths as usersPaths } from './users/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...resourceTypesPaths,
  ...schemasPaths,
  ...serviceProviderConfigPaths,
  ...usersPaths,
};
