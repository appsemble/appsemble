import Boom from '@hapi/boom';

import type { KoaMiddleware } from '../types';

type HttpMethod = 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put';

type Route = {
  route: string | RegExp;
  any?: KoaMiddleware;
} & {
  [method in HttpMethod]?: KoaMiddleware;
};

/**
 * A tiny dynamic router middleware for GET requests.
 */
export default (routes: Route[]): KoaMiddleware => async (ctx, next) => {
  const { path } = ctx;

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
  let method = ctx.method.toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(result, method)) {
    if (!Object.prototype.hasOwnProperty.call(result, 'any')) {
      throw Boom.methodNotAllowed();
    }
    method = 'any';
  }
  ctx.params = match?.groups ? { ...match.groups } : null;
  return result[method as HttpMethod](ctx, next);
};
