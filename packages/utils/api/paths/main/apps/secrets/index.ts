import { type OpenAPIV3 } from 'openapi-types';

import { paths as oauth2Paths } from './oauth2/index.js';
import { paths as samlPaths } from './saml/index.js';
import { paths as scimPaths } from './scim/index.js';
import { paths as servicePaths } from './service/index.js';
import { paths as sslPaths } from './ssl/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...oauth2Paths,
  ...samlPaths,
  ...scimPaths,
  ...servicePaths,
  ...sslPaths,
};
