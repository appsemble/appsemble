import { type OpenAPIV3 } from 'openapi-types';

import { paths as appsPaths } from './apps/index.js';
import { paths as commonPaths } from './common/index.js';
import { paths as mainPaths } from './main/index.js';

const mergedPaths: OpenAPIV3.PathsObject = {};

// TODO: restructure paths as this is a major place for bugs, because putting non path parameter ending endpoints after endpoints that end with a path parameter breaks the non path parameter ending endpoint
for (const paths of [appsPaths, mainPaths, commonPaths]) {
  for (const [path, entry] of Object.entries(paths)) {
    mergedPaths[path] = mergedPaths[path] ? { ...mergedPaths[path], ...entry } : entry;
  }
}

export const paths: OpenAPIV3.PathsObject = mergedPaths;
