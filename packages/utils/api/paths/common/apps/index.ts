import { type OpenAPIV3 } from 'openapi-types';

import { paths as assetsPaths } from './assets/index.js';
import { paths as iconPaths } from './icon.js';
import { paths as membersPaths } from './members/index.js';
import { paths as messagesPaths } from './messages/index.js';
import { paths as resourcesPaths } from './resources/index.js';
import { paths as stylePaths } from './styles/index.js';
import { paths as teamsPaths } from './teams/index.js';
import { paths as variablesPaths } from './variables/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...assetsPaths,
  ...iconPaths,
  ...membersPaths,
  ...messagesPaths,
  ...resourcesPaths,
  ...stylePaths,
  ...teamsPaths,
  ...variablesPaths,
};
