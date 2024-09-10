import { type OpenAPIV3 } from 'openapi-types';

import { paths as oauth2Paths } from './oauth2/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...oauth2Paths,
};
