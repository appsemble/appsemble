import Boom from '@hapi/boom';

/**
 * A tiny dynamic router middleware for GET requests.
 */
export default function tinyRouter(routes) {
  return async (ctx, next) => {
    const {
      path,
      state: { base },
    } = ctx;

    const relativePath = base ? path.substr(base.length) : path;
    let match;
    const result = routes.find(({ route }) => {
      match = typeof route === 'string' ? relativePath === route : relativePath.match(route);
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
    return result[method](ctx);
  };
}
