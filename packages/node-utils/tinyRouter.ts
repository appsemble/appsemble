import { has } from '@appsemble/utils';
import { type Middleware } from 'koa';

import { throwKoaError } from './koa.js';

type HttpMethod = 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put';

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
type Route = {
  [method in HttpMethod]?: Middleware;
} & {
  route: RegExp | string;
  any?: Middleware;
};

/**
 * A tiny dynamic router middleware for GET requests.
 *
 * @param routes The routes to serve.
 * @returns Middleware that serves middleware matching the route regex.
 */
export function tinyRouter(routes: Route[]): Middleware {
  return (ctx, next) => {
    const { method, path } = ctx;

    let match: RegExpMatchArray | undefined;
    const result = routes.find(({ route }) => {
      if (typeof route === 'string') {
        return path === route;
      }
      match = path.match(route) ?? undefined;
      return match;
    });
    if (!result) {
      return next();
    }
    let m = method.toLowerCase();
    if (!has(result, m)) {
      if (!has(result, 'any')) {
        throwKoaError(ctx, 405, 'Method not allowed');
      }
      m = 'any';
    }
    ctx.params = match?.groups ? { ...match.groups } : undefined;
    return result[m as HttpMethod]?.(ctx, next);
  };
}
