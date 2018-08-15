import Router from 'koa-router';

import faviconHandler from './faviconHandler';
import iconHandler from './iconHandler';
import indexHandler from './indexHandler';
import manifestHandler from './manifestHandler';


const router = new Router();
router.get('/:id(\\d+)/manifest.json', manifestHandler);
router.get('/:id(\\d+)/icon-:size(\\d+).png', iconHandler);
router.get('/:id(\\d+)/favicon.ico', faviconHandler);
router.get('/:id(\\d+)', indexHandler);
router.get('/:id(\\d+)/:path', indexHandler);


export default router.routes();
