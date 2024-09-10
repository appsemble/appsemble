import { type OpenAPIV3 } from 'openapi-types';

import { paths as appCollectionsPaths } from './app-collections/index.js';
import { paths as appPaths } from './apps/index.js';
import { paths as authPaths } from './auth/index.js';
import { paths as blocksPaths } from './blocks/index.js';
import { paths as containerLogsPaths } from './containerLogs.js';
import { paths as healthPaths } from './health.js';
import { paths as messagesPaths } from './messages/index.js';
import { paths as organizationsPaths } from './organizations/index.js';
import { paths as samlPaths } from './saml/index.js';
import { paths as sslPaths } from './ssl.js';
import { paths as timezonePaths } from './timezone.js';
import { paths as trainingBlocksPaths } from './training-blocks/index.js';
import { paths as trainingsPaths } from './trainings/index.js';
import { paths as usersPaths } from './users/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...appCollectionsPaths,
  ...appPaths,
  ...authPaths,
  ...blocksPaths,
  ...containerLogsPaths,
  ...healthPaths,
  ...messagesPaths,
  ...organizationsPaths,
  ...samlPaths,
  ...sslPaths,
  ...timezonePaths,
  ...trainingBlocksPaths,
  ...trainingsPaths,
  ...usersPaths,
};
