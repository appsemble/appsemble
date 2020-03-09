import Boom from '@hapi/boom';

/**
 * A tiny dynamic router middleware for GET requests.
 */
export default function tinyRouter(routes) {
  return async (ctx, next) => {
    const { path } = ctx;

    let match;
    const result = routes.find(({ route }) => {
      match = typeof route === 'string' ? path === route : path.match(route);
      return match;
    });
    if (!result) {
      return next();
    }
    const method = ctx.method.toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(result, method)) {
      throw Boom.methodNotAllowed();
    }
    ctx.params = { ...match.groups };
    return result[method](ctx, next);
  };
}
