import Router from 'koa-router';

import { bulmaURL, faURL } from '../utils/styleURL';
import editorHandler from './editorHandler';
import faviconHandler from './faviconHandler';
import iconHandler from './iconHandler';
import indexHandler from './indexHandler';
import manifestHandler from './manifestHandler';
import { bulmaHandler, faHandler } from './styleHandler';

const router = new Router();
router.get(bulmaURL, bulmaHandler);
router.get(faURL, faHandler);
router.get('/([a-z\\d/-]+)?', editorHandler);
router.get('/favicon.ico', faviconHandler);
router.get('/:id(\\d+)?/(fav)?icon-:width(\\d+).:format(png|jpg|tiff|webp)', iconHandler);
router.get(
  '/:id(\\d+)?/(fav)?icon-:width(\\d+)x:height(\\d+).:format(png|jpg|tiff|webp)',
  iconHandler,
);
router.get('/:id(\\d+)/manifest.json', manifestHandler);
router.get(
  '/:organizationId(@[a-z][a-z\\d-]*[a-z\\d])/:appId([a-z\\d-]+[a-z\\d])/(.*)?',
  indexHandler,
);

export default router.routes();
