import { type OpenAPIV3 } from 'openapi-types';

import { paths as languagePaths } from './language.js';

export const paths: OpenAPIV3.PathsObject = {
  ...languagePaths,
};
