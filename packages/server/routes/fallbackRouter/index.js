import tinyRouter from '../../middleware/tinyRouter';
import indexHandler from './indexHandler';
import redirectHandler from './redirectHandler';

export default tinyRouter([
  {
    route: '/',
    get: indexHandler,
  },
  {
    route: /.*/,
    get: redirectHandler,
  },
]);
