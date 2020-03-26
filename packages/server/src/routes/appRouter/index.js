import { partialNormalized, partialSemver } from '@appsemble/utils';

import tinyRouter from '../../middleware/tinyRouter';
import blockAssetHandler from './blockAssetHandler';
import iconHandler from './iconHandler';
import indexHandler from './indexHandler';
import manifestHandler from './manifestHandler';

export default tinyRouter([
  {
    route: '/manifest.json',
    get: manifestHandler,
  },
  {
    route: /^\/icon-(?<width>\d+)(x(?<height>\d+))?\.(?<format>png|jpg|tiff|webp)$/,
    get: iconHandler,
  },
  {
    route: new RegExp(
      `^/api/blocks/(?<name>@${partialNormalized.source}/${partialNormalized.source})/versions/(?<version>${partialSemver.source})/(?<filename>.+)$`,
    ),
    get: blockAssetHandler,
  },
  {
    route: new RegExp(`^(/${partialNormalized.source})?`),
    get: indexHandler,
  },
]);
