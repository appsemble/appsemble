import { type OpenAPIV3 } from 'openapi-types';

import { paths as invitesPaths } from './invites/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...invitesPaths,
};
