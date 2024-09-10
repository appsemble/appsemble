import { type OpenAPIV3 } from 'openapi-types';

import { paths as emailPaths } from './email/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...emailPaths,
};
