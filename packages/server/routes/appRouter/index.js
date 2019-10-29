import { partialNormalized } from '@appsemble/utils';

import tinyRouter from '../../middleware/tinyRouter';
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
    route: new RegExp(`^(/${partialNormalized.source})?`),
    get: indexHandler,
  },
]);
