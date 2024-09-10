import { paths as actionsPaths } from './actions/index.js';
import { paths as authPaths } from './auth/index.js';
import { paths as membersPaths } from './members/index.js';
import { paths as teamsPaths } from './teams/index.js';

export const paths = {
  ...actionsPaths,
  ...authPaths,
  ...membersPaths,
  ...teamsPaths,
};
