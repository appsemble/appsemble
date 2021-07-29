import { methodNotAllowed } from '@hapi/boom';
import { Middleware } from 'koa';

type HttpMethod = 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put';

type Route = {
  [method in HttpMethod]?: Middleware;
} & {
  route: RegExp | string;
  any?: Middleware;
};

/**
 * A tiny dynamic router middleware for GET requests.
 *
 * @param routes - The routes to serve.
 * @returns Middleware that serves middleware matching the route regex.
 */
export function tinyRouter(routes: Route[]): Middleware {
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
