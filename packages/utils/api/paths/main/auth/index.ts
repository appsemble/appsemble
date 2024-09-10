import { type OpenAPIV3 } from 'openapi-types';

import { paths as emailPaths } from './email/index.js';
import { paths as oauth2Paths } from './oauth2/authorizations/index.js';
import { paths as refreshTokenPaths } from './refreshToken.js';

export const paths: OpenAPIV3.PathsObject = {
  ...emailPaths,
  ...oauth2Paths,
  ...refreshTokenPaths,
};
