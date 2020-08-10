import { partialNormalized, partialSemver } from '@appsemble/utils';

import tinyRouter from '../../middleware/tinyRouter';
import blockAssetHandler from './blockAssetHandler';
import blockCSSHandler from './blockCSSHandler';
import cssHandler from './cssHandler';
import iconHandler from './iconHandler';
import indexHandler from './indexHandler';
import manifestHandler from './manifestHandler';
import organizationBlockCSSHandler from './organizationBlockCSSHandler';
import organizationCSSHandler from './organizationCSSHandler';
import robotsHandler from './robotsHandler';

const blockName = `(?<name>@${partialNormalized.source}/${partialNormalized.source})`;

export default tinyRouter([
  {
    route: '/manifest.json',
    get: manifestHandler,
  },
  {
    route: '/robots.txt',
    get: robotsHandler,
  },
  {
    route: /^\/icon-(?<width>\d+)(x(?<height>\d+))?\.(?<format>png|jpg|tiff|webp)$/,
    get: iconHandler,
  },
  {
    route: new RegExp(
      `^/api/blocks/${blockName}/versions/(?<version>${partialSemver.source})/(?<filename>.+)$`,
    ),
    get: blockAssetHandler,
  },
  {
    route: '/core.css',
    get: cssHandler('style'),
  },
  {
    route: '/organization/core.css',
    get: organizationCSSHandler('coreStyle'),
  },
  {
    route: '/shared.css',
    get: cssHandler('sharedStyle'),
  },
  {
    route: '/organization/shared.css',
    get: organizationCSSHandler('sharedStyle'),
  },
  {
    route: new RegExp(`^/${blockName}\\.css`),
    get: blockCSSHandler,
  },
  {
    route: new RegExp(`^/organization/${blockName}\\.css`),
    get: organizationBlockCSSHandler,
  },
  {
    route: /^\.well-known\//,
    any() {},
  },
  {
    route: new RegExp(/^[^.]+$/),
    get: indexHandler,
  },
]);
