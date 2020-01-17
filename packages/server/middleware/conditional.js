export default function conditional(check, middleware) {
  return (ctx, next) => {
    if (check(ctx)) {
      return middleware(ctx, next);
    }
    return next();
  };
}
