import { methodNotAllowed } from '@hapi/boom';

import { KoaMiddleware } from '../types';

type HttpMethod = 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put';

type Route = {
  [method in HttpMethod]?: KoaMiddleware;
} & {
  route: RegExp | string;
  any?: KoaMiddleware;
};

/**
 * A tiny dynamic router middleware for GET requests.
 *
 * @param routes - The routes to serve.
 *
 * @returns Middleware that serves middleware matching the route regex.
 */
export function tinyRouter(routes: Route[]): KoaMiddleware {
  return (ctx, next) => {
    const { method, path } = ctx;

    let match: RegExpMatchArray;
    const result = routes.find(({ route }) => {
      if (typeof route === 'string') {
        return path === route;
      }
      match = path.match(route);
      return match;
    });
    if (!result) {
      return next();
    }
    let m = method.toLowerCase();
    if (!Object.hasOwnProperty.call(result, m)) {
      if (!Object.hasOwnProperty.call(result, 'any')) {
        throw methodNotAllowed();
      }
      m = 'any';
    }
    ctx.params = match?.groups ? { ...match.groups } : null;
    return result[m as HttpMethod](ctx, next);
  };
}
