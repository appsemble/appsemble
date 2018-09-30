import Router from 'koa-router';

import editorHandler from './editorHandler';
import faviconHandler from './faviconHandler';
import iconHandler from './iconHandler';
import indexHandler from './indexHandler';
import manifestHandler from './manifestHandler';


const router = new Router();
router.get('/editor/(.*)?', editorHandler);
router.get('/:id(\\d+)?/favicon.ico', faviconHandler);
router.get('/:id(\\d+)?/(fav)?icon-:width(\\d+).:format(png|jpg|tiff|webp)', iconHandler);
router.get('/:id(\\d+)?/(fav)?icon-:width(\\d+)x:height(\\d+).:format(png|jpg|tiff|webp)', iconHandler);
router.get('/:id(\\d+)/manifest.json', manifestHandler);
router.get('/:id(\\d+)/(.*)?', indexHandler);


export default router.routes();
