import isIp from 'is-ip';

export default function appMapper(platformMiddleware, appMiddleware) {
  return async (ctx, next) => {
    const { argv, hostname } = ctx;

    if (new URL(argv.host).hostname === hostname || isIp(hostname)) {
      return platformMiddleware(ctx, next);
    }
    return appMiddleware(ctx, next);
  };
}
