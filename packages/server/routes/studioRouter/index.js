import { partialNormalized } from '@appsemble/utils';

import tinyRouter from '../../middleware/tinyRouter';
import faviconHandler from './faviconHandler';
import iconHandler from './iconHandler';
import indexHandler from './indexHandler';

export default tinyRouter([
  {
    route: '/favicon.ico',
    get: faviconHandler,
  },
  {
    route: /^\/icon-(?<width>\d+)(x(?<height>\d+))?\.(?<format>png|jpg|tiff|webp)$/,
    get: iconHandler,
  },
  {
    route: new RegExp(`^(/${partialNormalized.source})*`),
    get: indexHandler,
  },
]);
