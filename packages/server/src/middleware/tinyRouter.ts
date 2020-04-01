import Boom from '@hapi/boom';
import type { Middleware } from 'koa';

type HttpMethod = 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put';

type Route<StateT, CustomT> = {
  route: string | RegExp;
} & {
  [method in HttpMethod]?: Middleware<StateT, CustomT & TinyRouterContext>;
};

interface TinyRouterContext {
  /**
   * Named parameters extracted using the URL regex.
   */
  params: null | {
    [param: string]: string;
  };
}

/**
 * A tiny dynamic router middleware for GET requests.
 */
export default <StateT = {}, CustomT = {}>(
  routes: Route<StateT, CustomT>[],
): Middleware<StateT, CustomT & TinyRouterContext> => async (ctx, next) => {
  const { path } = ctx;

  let match: RegExpMatchArray;
  const result = routes.find(({ route }) => {
    match = path.match(route);
    return match || (typeof route === 'string' && path === route);
  });
  if (!result) {
    return next();
  }
  const method = ctx.method.toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(result, method)) {
    throw Boom.methodNotAllowed();
  }
  ctx.params = match?.groups ? { ...match.groups } : null;
  return result[method as HttpMethod](ctx, next);
};
